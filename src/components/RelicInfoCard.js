// src/components/RelicInfoCard.js
const { getCache } = require("../cache");

function RelicInfoCard({ relicName }) {
  console.log("Cache lookup for", relicName, ":", getCache(relicName));
  const relicCard = document.createElement("div");
  relicCard.classList.add("relic-card");
  relicCard.innerHTML = `<p>${relicName}</p><p>Avg Price: ${Math.floor(Math.random() * 1000) + 1}p</p>`;
  return relicCard;
}

module.exports = { RelicInfoCard };
