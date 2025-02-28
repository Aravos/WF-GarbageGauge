const cache = {};

function setCache(key, url_name) {
  cache[key] = url_name;
}

function getCache(key) {
  return cache[key];
}

function getAllCache() {
  return cache;
}

async function loadValidWordsSet(validWordsSet, ItemSet){
  ItemSet = new Set(Object.keys(getAllCache()));
  ItemSet.forEach(item => item.split(/\s+/).forEach(word => validWordsSet.add(word)));
  return ItemSet;
}

async function calculateRecentPrice(url_name) {
  try {
    const response = await fetch(`https://api.warframe.market/v1/items/${url_name}/orders`, {
      headers: { "Platform": "pc" }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const orders = data.payload.orders;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Filter only recent sell orders
    const recentOrders = orders.filter(order => {
      const lastUpdate = new Date(order.last_update);
      return lastUpdate >= threeDaysAgo && order.order_type === "sell" && order.visible;
    });

    // Extract prices
    const prices = recentOrders.map(order => order.platinum);

    if (prices.length === 0) {
      return null; // No recent prices available
    }

    // Calculate average price
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  } catch (error) {
    console.error(`Error fetching orders for ${url_name}:`, error);
    return null;
  }
}

async function loadCache() {
  try {
    const response = await fetch("https://api.warframe.market/v1/items", {
      headers: { "Language": "en" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const items = data.payload.items;

    console.log(`Fetching data for ${items.length} items...`);

    for (const item of items) {
      const loweredName = item.item_name.toLowerCase();
      if (loweredName.includes("prime")) {
        setCache(loweredName, item.url_name);
      }
    }

    console.log("Cache populated:", Object.keys(getAllCache()).length);
  } catch (error) {
    console.error("Error fetching items:", error);
  }
}


module.exports = { getCache, getAllCache, loadCache, calculateRecentPrice, loadValidWordsSet };
