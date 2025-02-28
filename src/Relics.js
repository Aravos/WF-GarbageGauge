const { getCache, calculateRecentPrice } = require("./cache");
const { ipcRenderer } = require("electron");
const fs = require("fs").promises; // using fs.promises for async file operations
const path = require("path");
const { fetchPrice } = require("./Db/database");

// Creates and returns a relic container element.
function containerRelic() {
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  return relicContainer;
}

// Generates all permutations of an array.
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

// Finds a matching phrase from permutations of validWords that exists in compareSet.
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

// Performs OCR asynchronously and returns an array of relic objects.
async function runOCR(validWordsSet, compareAndCheck) {
  let primeParts = [];
  try {
    const inputImage = path.join(__dirname, "./screenshot.png");

    // Asynchronously check if the image file exists.
    try {
      await fs.access(inputImage);
    } catch (err) {
      console.error("Image file not found:", inputImage);
      return [];
    }

    // Invoke the OCR process via Electron's ipcRenderer.
    const { text, anchorGroups } = await ipcRenderer.invoke("perform-ocr", inputImage);
    const anchorMatches = [];

    if (anchorGroups && anchorGroups.length > 0) {
      for (const group of anchorGroups) {
        if (group.anchor.text.toLowerCase() === "forma") {
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

    primeParts = anchorMatches;
  } catch (error) {
    console.error("Error in OCR:", error);
    primeParts = [];
  }

  if (!primeParts.length) {
    console.warn("No relics available.");
    return [];
  }
  return primeParts.map(relicName => ({ relicName }));
}

// Renders relic cards by fetching OCR data and then updating the DOM.
async function renderRelicCards(relicContainer, validWordsSet, compareAndCheck) {
  relicContainer.innerHTML = "";

  // Check if onScreen is defined and true.
  if (typeof onScreen !== "undefined" && onScreen) {
    const relics = await runOCR(validWordsSet, compareAndCheck);
    console.log("Relics:", relics);

    // Process all relics concurrently.
    const relicData = await Promise.all(
      relics.map(async (relic) => {
        let avgPrice = null;
        if (relic.relicName !== "Forma Blueprint") {
          const url = getCache(relic.relicName);
          const price = await fetchPrice(url);
          avgPrice = price ? parseFloat(price.avg_price).toFixed(1) : null;
        }
        return { relicName: relic.relicName, avgPrice };
      })
    );

    // Find the highest price among the relics.
    const highestPrice = relicData.reduce(
      (max, { avgPrice }) => (avgPrice !== null && avgPrice > max ? avgPrice : max),
      0
    );

    // Create and append card elements for each relic.
    relicData.forEach(relic => {
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
    });
    console.log(`${relics.length} relics rendered.`);
  }
}

module.exports = { containerRelic, runOCR, renderRelicCards };