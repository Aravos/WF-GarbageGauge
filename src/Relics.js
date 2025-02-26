const { getCache, calculateRecentPrice } = require("./cache");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

async function runOCR(imagePath) {
    try {
        const ocrText = await ipcRenderer.invoke("perform-ocr", imagePath);
        console.log("OCR text from main process:", ocrText);
        return ocrText;  // Return the result so that the caller gets a valid string.
    } catch (err) {
        console.error("Error during OCR invocation:", err);
        return "";
    }
}

  
// ---------- Global Setup for Valid Words ----------
const filePath = path.join(__dirname, "output.txt");
const lines = fs.readFileSync(filePath, "utf-8")
  .split("\n")
  .map(line => line.trim())
  .filter((_, index) => index % 2 === 0);
const filteredLinesSet = new Set(lines);
const validWordsSet = new Set();
filteredLinesSet.forEach(item => item.split(/\s+/).forEach(word => validWordsSet.add(word)));

console.log("Valid Words Set:", validWordsSet);

// ---------- UI Helper ----------
function containerRelic() {
  // This function should return a new DOM element
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  return relicContainer;
}

// ---------- Sliding Window Function (word-based) ----------
function findSlidingWindowMatches(list, searchWords, minWindowSize = 2) {
  const matches = new Set();
  const numWords = searchWords.length;
  for (let windowSize = minWindowSize; windowSize <= numWords; windowSize++) {
    for (let start = 0; start <= numWords - windowSize; start++) {
      const phrase = searchWords.slice(start, start + windowSize).join(" ");
      if (list.has(phrase)) {
        matches.add(phrase);
      }
    }
  }
  return Array.from(matches);
}

// ---------- Process Image and OCR ----------
async function processImage() {
    try {
        const inputImage = path.join(__dirname, "screenshot.png");
        if (!fs.existsSync(inputImage)) {
        console.error("Image file not found:", inputImage);
        return [];
        }
        
        // Await the OCR result from main process via IPC
        const text = await runOCR(inputImage);
        const cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
        
        // Filter out words not in validWordsSet
        const cleanedWords = cleanedText
        .split(" ")
        .filter(word => validWordsSet.has(word));
        console.log("Recognized Cleaned Words:", cleanedWords);

        // Find best-match using sliding window.
        const matches = findSlidingWindowMatches(filteredLinesSet, cleanedWords);
        console.log("Sliding Window Matches:", matches);
        return matches.length ? matches : [];
    } catch (error) {
        console.error("Error in OCR:", error);
        return [];
    }
}
// ---------- Generate Relics ----------
async function generateRelics() {
  const inputImagePath = path.join(__dirname, "ss.jpg");
  const primeParts = await processImage(inputImagePath);
  if (!Array.isArray(primeParts) || primeParts.length === 0) {
    console.warn("No relics available.");
    return [];
  }
  return primeParts.map(relicName => ({ relicName }));
}

// ---------- Render Relic Cards ----------
async function renderRelicCards(relicContainer) {
  relicContainer.innerHTML = "";
  if (typeof onScreen !== "undefined" && onScreen) {
    const relics = await generateRelics();
    for (const relic of relics) {
      const url = getCache(relic.relicName);
      if (!url) continue;
      const avgPrice = await calculateRecentPrice(url);
      // RelicInfoCard should be defined elsewhere in your project.
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

module.exports = { containerRelic, generateRelics, renderRelicCards };