const { getCache, calculateRecentPrice } = require("./cache");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

function containerRelic() {
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  return relicContainer;
}

function generatePermutations(arr) {
  if (arr.length <= 1) return [arr];
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const remainingPermutations = generatePermutations(remaining);
    for (const perm of remainingPermutations) {
      results.push([current, ...perm]);
    }
  }
  return results;
}

function findPermutationMatches(compareSet, validWords) {
  const perms = generatePermutations(validWords);
  for (const perm of perms) {
    const phrase = perm.join(" ");
    console.log("Checking permutation:", phrase);
    if (compareSet.has(phrase)) {
      console.log("Match found:", phrase);
      return phrase;
    }
  }
  return null;
}

async function runOCR(validWordsSet, compareAndCheck) {
  let primeParts;
  try {
    const inputImage = path.join(__dirname, "./screenshot.png");
    if (!fs.existsSync(inputImage)) {
      console.error("Image file not found:", inputImage);
      return [];
    }

    const { text, anchorGroups } = await ipcRenderer.invoke("perform-ocr", inputImage);

    let anchorMatches = [];
    if (anchorGroups && anchorGroups.length > 0) {
      for (const group of anchorGroups) {
        if (group.anchor.text === "forma") {
          anchorMatches.push("Forma Blueprint");
          continue;
        }

        const groupWords = group.words.map(word => word.text);

        console.log("Cleaned Group Words:", groupWords);
        if (groupWords.length > 0) {
          const groupMatch = findPermutationMatches(compareAndCheck, groupWords);
          if (groupMatch) {
            console.log("Permutation Match for group:", groupMatch);
            anchorMatches.push(groupMatch);
          }
        }
      }
    } else {
      console.warn("No anchor groups found.");
    }

    primeParts = anchorMatches.length ? anchorMatches : [];
  } catch (error) {
    console.error("Error in OCR:", error);
    primeParts = [];
  }

  if (!Array.isArray(primeParts) || primeParts.length === 0) {
    console.warn("No relics available.");
    return [];
  }
  return primeParts.map(relicName => ({ relicName }));
}

async function renderRelicCards(relicContainer, validWordsSet, compareAndCheck) {
  relicContainer.innerHTML = "";
  if (typeof onScreen !== "undefined" && onScreen) {
    const relics = await runOCR(validWordsSet, compareAndCheck);
    console.log("Relics:", relics);

    let highestPrice = 0;
    const relicData = [];

    for (const relic of relics) {
      let avgPrice = null;
      let url = null;
      if (relic.relicName !== "Forma Blueprint") {
        url = getCache(relic.relicName);
        avgPrice = await calculateRecentPrice(url);
      }
      relicData.push({ relicName: relic.relicName, avgPrice });

      if (avgPrice !== null && avgPrice > highestPrice) {
        highestPrice = avgPrice;
      }
    }

    for (const relic of relicData) {
      const isHighValue = relic.avgPrice === highestPrice && highestPrice !== 0;
      const cardElement = RelicInfoCard({
        relicName: relic.relicName,
        avgPrice: relic.avgPrice,
        isHighValue
      });
      
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