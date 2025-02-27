const { getAllCache, getCache, calculateRecentPrice } = require("./cache");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

// ---------- UI Relic Container ----------
function containerRelic() {
  // This function should return a new DOM element
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  return relicContainer;
}


function findSlidingWindowMatches(list, searchWords, minWindowSize = 2) {
  console.log(list);
  // const matches = new Set();
  let matches = [];
  const numWords = searchWords.length;
  for (let windowSize = minWindowSize; windowSize <= numWords; windowSize++) {
    for (let start = 0; start <= numWords - windowSize; start++) {
      const phrase = searchWords.slice(start, start + windowSize).join(" ");
      if (list.has(phrase)) {
        matches.push([start, phrase]);
      }else if (phrase.toLowerCase() === "forma blueprint"){
        matches.push([start, "Forma Blueprint"]);
      }
    }
  }
  matches.sort((a, b) => a[0] - b[0]);
  matches = matches.map(item => item[1]);
  return matches;
}

// ---------- Generate Relics ----------
async function runOCR(validWordsSet , compareAndCheck, dimensions) {
  let primeParts;
  try {
    console.log(validWordsSet);
    const inputImage = path.join(__dirname, "./screenshot.png");
    if (!fs.existsSync(inputImage)) {
    console.error("Image file not found:", inputImage);
    return [];
    }
    
    // Await the OCR result from main process via IPC
    const text = await ipcRenderer.invoke("perform-ocr", inputImage, dimensions);
    const cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    
    // Filter out words not in validWordsSet
    const cleanedWords = cleanedText
    .split(" ")
    .filter(word => validWordsSet.has(word));
    console.log("Recognized Cleaned Words:", cleanedWords);
    console.log("compareAndCheck:", compareAndCheck);
    const matches = findSlidingWindowMatches(compareAndCheck, cleanedWords);
    
    console.log("Sliding Window Matches:", matches);

    primeParts = matches.length ? matches : [];
  } catch (error) {
      console.error("Error in OCR:", error);
      primeParts = [];
  }

  if (!Array.isArray(primeParts) || primeParts.length === 0) {
    console.warn("No relics available.");
    return [];
  }
  return primeParts.map( relicName => ({ relicName }));
}

// ---------- Render Relic Cards ----------
async function renderRelicCards(relicContainer, validWordsSet, compareAndCheck, dimensions) {
  relicContainer.innerHTML = "";
  if (typeof onScreen !== "undefined" && onScreen) {
    const relics = await runOCR(validWordsSet, compareAndCheck, dimensions);
    for (const relic of relics) {
      let avgPrice = null;
      if(relic.relicName !== "Forma Blueprint"){
        const url = getCache(relic.relicName);
        avgPrice = await calculateRecentPrice(url);
      }
      const cardElement = RelicInfoCard({ relicName: relic.relicName, avgPrice });
      if (cardElement instanceof Node) {
        relicContainer.appendChild(cardElement);
      } else {
        console.error("RelicInfoCard did not return a valid Node:", cardElement);
      }
    }
    console.log(`${relics.length} relics rendered.`);
  }
}

module.exports = { containerRelic, runOCR, renderRelicCards };