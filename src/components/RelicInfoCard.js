function RelicInfoCard({ relicName, avgPrice }) {
    const relicCard = document.createElement("div");
    let plat = '<img src="./assets/PlatinumLarge.webp" alt="Plat" class="plat-icon">';
    relicCard.classList.add("relic-card");
    relicCard.innerHTML = `<p>${relicName}</p><p>${avgPrice !== null ? avgPrice.toFixed(1) + " " + plat : "N/A"}</p>`;
    return relicCard;
}

module.exports = { RelicInfoCard };
