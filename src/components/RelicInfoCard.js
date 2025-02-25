function RelicInfoCard({ relicName, avgPrice }) {
    const relicCard = document.createElement("div");
    relicCard.classList.add("relic-card");
    relicCard.innerHTML = `<p>${relicName}</p><p>Avg Price: ${avgPrice !== null ? avgPrice.toFixed(2) + "p" : "N/A"}</p>`;
    return relicCard;
}

module.exports = { RelicInfoCard };
