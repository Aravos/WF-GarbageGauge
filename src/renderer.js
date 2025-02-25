// renderer.js
const { ipcRenderer } = require("electron");
const { getAllCache, loadCache } = require("./cache.js");
const { RelicInfoCard } = require("./components/RelicInfoCard.js");
const { renderRelicCards } = require("./Relics.js");

let onScreen = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");
  loadCache();

  const captureButton = document.getElementById("capture-button");
  
  // Create relic container if not already in your index.html
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  document.body.appendChild(relicContainer);
  console.log("Relic container added to DOM.");

  captureButton.addEventListener("click", async () => {
    onScreen = !onScreen;
    console.log(onScreen ? "CAPTURE INITIATED" : "CLEAR INITIATED");

    ipcRenderer.invoke("capture-screen").then((filePath) => {
      if (filePath) {
        console.log("Screenshot saved at:", filePath);
      } else {
        console.error("Failed to capture screenshot.");
      }
    });

    captureButton.textContent = onScreen ? "Clear" : "Capture Screenshot";
    renderRelicCards(relicContainer);
  });
});
