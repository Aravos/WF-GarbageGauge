// main.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('node:path');

// Optional: Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  // Define file path and initialize content array
  const filePath = path.join(__dirname, 'output.txt');
  let content = [];

  // Fetch items from the API
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
      // Loop over the items and add their names to the content array
      items.forEach(item => {
        // Use the English item name if available
        const itemName = item.item_name ? item.item_name : 'Unknown Item';
        const itemURL = item.url_name;
        content.push(itemName + '\n' + itemURL );
      });
      // Write the joined array (as a string) to the output file
      fs.writeFile(filePath, content.join('\n'), (err) => {
        if (err) {
          console.error('Error writing file:', err);
        } else {
          console.log('Startup file written successfully');
        }
      });
    })
    .catch(error => {
      console.error('Error fetching items:', error);
      // Removed listElement reference because it's undefined in the main process.
    });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
