// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  captureScreen: () => ipcRenderer.invoke("capture-screen"),
});
