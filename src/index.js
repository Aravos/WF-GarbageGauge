const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { setCache, getAllCache } = require("./cache");
const { captureScreen } = require("./capture");
const path = require("path");

// Create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    transparent: true, // Makes the window background transparent
    frame: false,      // Removes the default window frame
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Load the preload script
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Disable direct Node.js integration in the renderer
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  // Uncomment to open DevTools:
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  const filePath = path.join(__dirname, 'output.txt');
  let content = [];

  fetch('https://api.warframe.market/v1/items', {
    headers: {
      'Language': 'en'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const items = data.payload.items;

      items.forEach(item => {

        const key = item.url_name || 'unknown';
        const value = item.item_name || 'Unknown Item';
        setCache(key, value);
      });
      console.log("Cache populated:", Object.keys(getAllCache()).length);
    })
    .catch(error => {
      console.error("Error fetching items:", error);
    });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Import the captureScreen function and handle the IPC call.
ipcMain.handle("capture-screen", async () => {
  return await captureScreen();
});
