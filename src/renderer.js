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
    validWordsSet.add("Forma");
  } catch (error) {
    console.error(error);
  }
}

initialize();

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");

  const captureButton = document.getElementById("capture-button");
  const captureAreaButton = document.getElementById("capture-area-button");
  const highlightArea = document.querySelector(".highlight-area");
  const sliderContainer = document.querySelector(".slider-container");
  
  let dimensions = [];

  const sliderLeft = document.getElementById("slider-left");
  const sliderTop = document.getElementById("slider-top");
  const sliderWidth = document.getElementById("slider-width");
  const sliderHeight = document.getElementById("slider-height");
  
  const valueLeft = document.getElementById("value-left");
  const valueTop = document.getElementById("value-top");
  const valueWidth = document.getElementById("value-width");
  const valueHeight = document.getElementById("value-height");

  function updateHighlight() {
    const left = sliderLeft.value;
    const top = sliderTop.value;
    const width = sliderWidth.value;
    const height = sliderHeight.value;

    // Update displayed slider values.
    valueLeft.textContent = `${left}%`;
    valueTop.textContent = `${top}%`;
    valueWidth.textContent = `${width}%`;
    valueHeight.textContent = `${height}%`;

    // Set the style of the highlight area.
    highlightArea.style.width = `${width}%`;
    highlightArea.style.height = `${height}%`;
    highlightArea.style.left = `${left}%`;
    highlightArea.style.top = `${top}%`;

    dimensions = [left / 100, top / 100, width / 100, height / 100];
    console.log("Updated dimensions:", dimensions);
  }

  // Attach event listeners to sliders.
  sliderLeft.addEventListener("input", updateHighlight);
  sliderTop.addEventListener("input", updateHighlight);
  sliderWidth.addEventListener("input", updateHighlight);
  sliderHeight.addEventListener("input", updateHighlight);

  updateHighlight();
  highlightArea.style.display = "none";
  sliderContainer.style.display = "none";

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
          renderRelicCards(relicContainer, validWordsSet, ItemSet, dimensions);
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

  captureAreaButton.addEventListener("click", () => {
    // Toggle slider container visibility.
    showCaptureArea = !showCaptureArea;
    sliderContainer.style.display = showCaptureArea ? "flex" : "none";
    captureAreaButton.textContent = showCaptureArea ? "Hide Capture Area" : "Show Capture Area";
    
    // When showing, update the highlight area.
    if (showCaptureArea) {
      updateHighlight();
      highlightArea.style.display = "block";
    } else {
      highlightArea.style.display = "none";
    }
  });
});
