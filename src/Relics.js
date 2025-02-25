const { getAllCache, getCache, calculateRecentPrice } = require("./cache");

function containerRelic() {
    const relicContainer = document.createElement("div");
    relicContainer.classList.add("relic-info-container");
    return relicContainer;
}

function generateRelics() {
    const allCache = getAllCache();
    const relicKeys = Object.keys(allCache);

    if (relicKeys.length === 0) {
        console.warn("Cache is empty. No relics available.");
        return [];
    }

    const numRelics = Math.floor(Math.random() * 4) + 1;
    const relics = [];
    for (let i = 0; i < numRelics; i++) {
        const randomIndex = Math.floor(Math.random() * relicKeys.length);
        const relicName = relicKeys[randomIndex];
        relics.push({ relicName });
    }
    return relics;
}

async function renderRelicCards(relicContainer) {
    relicContainer.innerHTML = "";
    if (onScreen) {
        const relics = generateRelics();

        for (const relic of relics) {
            const url = getCache(relic.relicName);
            if (!url) continue;

            const avgPrice = await calculateRecentPrice(url); // Await here!
            const cardElement = RelicInfoCard({ relicName: relic.relicName, avgPrice }); // Pass avgPrice correctly

            if (cardElement instanceof Node) { // Ensure it's a valid DOM element
                relicContainer.appendChild(cardElement);
            } else {
                console.error("RelicInfoCard did not return a valid Node:", cardElement);
            }
        }

        console.log(`${relics.length} relics rendered.`);
    }
}


module.exports = { containerRelic, generateRelics, renderRelicCards };
