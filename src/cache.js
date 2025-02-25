const cache = {};

function setCache(key, value) {
  cache[key] = value;
}

function getCache(key) {
  return cache[key];
}

function getAllCache() {
  return cache;
}

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
}

module.exports = { getCache, getAllCache, loadCache };
