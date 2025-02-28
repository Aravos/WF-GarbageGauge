const { getAllCache, getCache, calculateRecentPrice } = require("./cache");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

// ---------- UI Relic Container ----------
function containerRelic() {
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  return relicContainer;
}

/**
 * Generates all permutations (all possible orderings) of the input array.
 * Warning: This can grow factorially with the number of items.
 */
function generatePermutations(arr) {
  if (arr.length === 0) return [];
  if (arr.length === 1) return [arr];
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
  // Generate all possible orderings of the validWords.
  const perms = generatePermutations(validWords);
  const matches = [];
  perms.forEach(perm => {
    // Join the permutation array into a phrase.
    const phrase = perm.join(" ");
    if (compareSet.has(phrase)) {
      matches.push(phrase);
    }
  });
  return matches;
}

// ---------- Generate Relics ----------
async function runOCR(validWordsSet, compareAndCheck) {
  let primeParts;
  try {
    const inputImage = path.join(__dirname, "./screenshot.png");
    if (!fs.existsSync(inputImage)) {
      console.error("Image file not found:", inputImage);
      return [];
    }
    
    // Get the OCR result (raw text and anchorGroups)
    const { text, anchorGroups } = await ipcRenderer.invoke("perform-ocr", inputImage);
    console.log("OCR Text:", text);
    console.log("OCR Anchor Groups:", anchorGroups);
    
    let anchorMatches = [];
    if (anchorGroups && anchorGroups.length > 0) {
      anchorGroups.forEach(group => {
        // Clean and filter each word in the group.
        const groupWords = group.words
          .map(word => word.text.replace(/[^a-zA-Z0-9]/g, "").trim())
          .filter(word => word !== "" && validWordsSet.has(word));
        console.log("Cleaned Group Words:", groupWords);
        if (groupWords.length > 0) {
          // Generate all permutations from the valid words
          const groupMatches = findPermutationMatches(compareAndCheck, groupWords);
          console.log("Permutation Matches for group:", groupMatches);
          anchorMatches.push(...groupMatches);
        }
      });
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

// ---------- Render Relic Cards ----------
async function renderRelicCards(relicContainer, validWordsSet, compareAndCheck) {
  relicContainer.innerHTML = "";
  if (typeof onScreen !== "undefined" && onScreen) {
    const relics = await runOCR(validWordsSet, compareAndCheck);
    console.log("Relics: ",relics);
    let highestPrice = 0;
    const relicData = [];

    for (const relic of relics) {
      let avgPrice = null;
      const url = null;
      if (relic.relicName !== "Forma Blueprint") {
        const url = getCache(relic.relicName);
        avgPrice = await calculateRecentPrice(url);
      }
      relicData.push({ relicName: relic.relicName, avgPrice });

      if (avgPrice !== null && avgPrice > highestPrice) {
        highestPrice = avgPrice;
      }
    }

    for (const relic of relicData) {
      const isHighValue = relic.avgPrice === highestPrice && highestPrice !== 0;
      const cardElement = RelicInfoCard({ relicName: relic.relicName, avgPrice: relic.avgPrice, isHighValue });
      
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
