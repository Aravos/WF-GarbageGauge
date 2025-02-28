const { ipcRenderer, screen } = require("electron");
const { loadCache, loadValidWordsSet } = require("./cache.js");
const { RelicInfoCard } = require("./components/RelicInfoCard.js");
const { renderRelicCards, containerRelic } = require("./Relics.js");

let onScreen = false;
let showCaptureArea = false;
let validWordsSet = new Set();
let ItemSet;

async function initialize() {
  try {
    await loadCache();
    ItemSet = await loadValidWordsSet(validWordsSet, ItemSet);
    validWordsSet.add("Forma Blueprint");
  } catch (error) {
    console.error(error);
  }
}

initialize();

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");

  const captureButton = document.getElementById("capture-button");
  const captureAreaButton = document.getElementById("capture-area-button");


  const relicContainer = containerRelic();
  document.body.appendChild(relicContainer);
  console.log("Relic container added to DOM.");

  captureButton.addEventListener("click", async () => {
    onScreen = !onScreen;
    console.log(onScreen ? "CAPTURE INITIATED" : "CLEAR INITIATED");

    if (onScreen) {
      try {
        const filePath = await ipcRenderer.invoke("capture-screen");
        if (filePath) {
          console.log("Screenshot saved at:", filePath);
          console.log("passed 3")
          renderRelicCards(relicContainer, validWordsSet, ItemSet);
          console.log("passed 4")
        } else {
          console.error("Failed to capture screenshot.");
        }
      } catch (error) {
        console.error("Error capturing screenshot:", error);
      }
    } else {
      relicContainer.innerHTML = "";
    }
    captureButton.textContent = onScreen ? "Clear" : "Capture Screenshot";
  });

});
