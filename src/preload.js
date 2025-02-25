// // src/preload.js
// const { contextBridge, ipcRenderer } = require("electron");
// const { getAllCache } = require("./cache.js");
// const { captureScreen } = require("./capture.js");

// // Expose functions to the renderer
// contextBridge.exposeInMainWorld("api", {
//   captureScreen: () => ipcRenderer.invoke("capture-screen"),
// });

// contextBridge.exposeInMainWorld("cacheAPI", {
//   getAllCache: () => getAllCache()
// });

// console.log("Preload script loaded successfully");
