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

module.exports = { setCache, getCache, getAllCache };
