function RelicInfoCard({ relicName, avgPrice, isHighValue }) {
  const relicCard = document.createElement("div");
  let plat = '<img src="./assets/PlatinumLarge.webp" alt="Plat" class="plat-icon">';

  relicCard.classList.add("relic-card");

  if (isHighValue) {
    relicCard.classList.add("high-value"); // Highlight highest-value relic
  } else {
    relicCard.classList.add("normal-value"); // Normal relics
  }

  relicCard.innerHTML = `
      <p>${relicName}</p>
      <p>${avgPrice !== null ? avgPrice + " " + plat : "N/A"}</p>
    `;

  return relicCard;
}

module.exports = { RelicInfoCard };
