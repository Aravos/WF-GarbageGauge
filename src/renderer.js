// renderer.js
const { ipcRenderer } = require("electron");
const { getAllCache, setCache } = require("./cache.js");
const { RelicInfoCard } = require("./components/RelicInfoCard.js");

let onScreen = false;

function loadCache(){
  fetch("https://api.warframe.market/v1/items", {
    headers: { "Language": "en" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      data.payload.items.forEach((item) => {
        setCache(item.url_name || "unknown", item.item_name || "Unknown Item");
      });
      console.log("Cache populated:", Object.keys(getAllCache()).length);
    })
    .catch((error) => {
      console.error("Error fetching items:", error);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");
  loadCache();

  const captureButton = document.getElementById("capture-button");
  
  // Create relic container if not already in your index.html
  const relicContainer = document.createElement("div");
  relicContainer.classList.add("relic-info-container");
  document.body.appendChild(relicContainer);
  console.log("Relic container added to DOM.");

  function generateRelics() {
    const allCache = getAllCache();
    console.log(allCache);
    const relicKeys = Object.keys(allCache);

    if (relicKeys.length === 0) {
      console.warn("Cache is empty. No relics available.");
      return [];
    }

    const numRelics = Math.floor(Math.random() * 4) + 1;
    const relics = [];
    for (let i = 0; i < numRelics; i++) {
      const randomIndex = Math.floor(Math.random() * relicKeys.length);
      const relicName = allCache[relicKeys[randomIndex]];
      relics.push({ relicName });
    }
    return relics;
  }

  function renderRelicCards() {
    relicContainer.innerHTML = "";
    if (onScreen) {
      const relics = generateRelics();
      relics.forEach(relic => {
        const cardElement = RelicInfoCard({ relicName: relic.relicName });
        relicContainer.appendChild(cardElement);
      });
      console.log(`${relics.length} relics rendered.`);
    }
  }

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
    renderRelicCards();
  });
});
