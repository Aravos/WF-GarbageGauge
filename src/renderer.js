const { ipcRenderer } = require("electron");
const { loadCache, loadValidWordsSet } = require("./cache.js");
const { RelicInfoCard } = require("./components/RelicInfoCard.js");
const { renderRelicCards, containerRelic } = require("./Relics.js");

let onScreen = false;
let validWordsSet = new Set();
let ItemSet;

async function initialize() {
  try {
    await loadCache();
    ItemSet = await loadValidWordsSet(validWordsSet, ItemSet);
    validWordsSet.add("Forma");
  } catch (error) {
    console.error(error);
  }
}

initialize();

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");

  const captureButton = document.getElementById("capture-button");
  
  const relicContainer = containerRelic();
  document.body.appendChild(relicContainer);
  console.log("Relic container added to DOM.");

  captureButton.addEventListener("click", async () => {
    onScreen = !onScreen;
    console.log(onScreen ? "CAPTURE INITIATED" : "CLEAR INITIATED");
    if(onScreen){
      ipcRenderer.invoke("capture-screen").then((filePath) => {
        if (filePath) {
          console.log("Screenshot saved at:", filePath);
          renderRelicCards(relicContainer, validWordsSet, ItemSet);
        } else {
          console.error("Failed to capture screenshot.");
        }
      });
    }else{
      relicContainer.innerHTML = "";
    }

    captureButton.textContent = onScreen ? "Clear" : "Capture Screenshot";
  });
});
