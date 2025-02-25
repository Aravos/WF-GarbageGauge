const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { setCache, getAllCache } = require("./cache.js");
const { captureScreen } = require("./capture.js");
const path = require("path");

// Handle IPC from renderer
ipcMain.handle("capture-screen", async () => {
  try {
    return await captureScreen();
  } catch (err) {
    console.error("Error capturing screen:", err);
    return null;
  }
});

ipcMain.handle("get-cache", async () => {
  return getAllCache(); // Send stored cache to renderer
});


// Create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    transparent: true, // Opaque background can be used for debugging; change as needed.
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Ensure this path is correct.
      contextIsolation: false,
      nodeIntegration: true, // Security: disable direct Node integration in renderer.
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
