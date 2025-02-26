const { ipcRenderer } = require("electron");
const { loadCache } = require("./cache.js");
const { RelicInfoCard } = require("./components/RelicInfoCard.js");
const { renderRelicCards, containerRelic } = require("./Relics.js");

let onScreen = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");
  loadCache();

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
        } else {
          console.error("Failed to capture screenshot.");
        }
      });
    }

    captureButton.textContent = onScreen ? "Clear" : "Capture Screenshot";
    renderRelicCards(relicContainer);
  });
});
