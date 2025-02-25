const { contextBridge } = require("electron");
const { captureScreen } = require("./capture");

contextBridge.exposeInMainWorld("api", {
  captureScreen
});
