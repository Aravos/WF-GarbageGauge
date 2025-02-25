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

function renderRelicCards(relicContainer) {
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

module.exports = { generateRelics, renderRelicCards}
