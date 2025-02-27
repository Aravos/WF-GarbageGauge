const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { setCache, getAllCache } = require("./cache.js");
const sharp = require("sharp");
const { createWorker } = require("tesseract.js");
const { captureScreen } = require("./capture.js");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
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

ipcMain.handle("capture-screen", async () => {
  try {
    return await captureScreen();
  } catch (err) {
    console.error("Error capturing screen:", err);
    return null;
  }
});

ipcMain.handle("get-cache", async () => {
  return getAllCache();
});

async function processImageOCR(imagePath, dimensions) {
  console.log(dimensions)
  try {
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return { text: "", anchorGroups: [] };
    }

    // Preprocess the image with Sharp
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Crop + greyscale + gamma
    const croppedBuffer = await image
      .extract({
        left: Math.floor(metadata.width * dimensions[0]),
        top: Math.floor(metadata.height * dimensions[1]),
        width: Math.floor(metadata.width * dimensions[2]),
        height: Math.floor(metadata.height * dimensions[3]),
      })
      .greyscale()
      .gamma(2)
      .toBuffer();

    console.log("Image preprocessed successfully.");
    await sharp(croppedBuffer).toFile(path.join(__dirname, "final.png"));
    console.log("Final image saved as final.png.");

    // Use Tesseract to get bounding box data
    const worker = await createWorker("eng");
    // Tesseract.js v6 example
    const { data } = await worker.recognize(croppedBuffer, {}, { words: true });
    await worker.terminate();

    // data.text is the raw text
    // data.words is an array of word objects with bounding boxes
    console.log("data  ",data);
    const { text, words } = data;
    console.log("OCR completed. Recognized text:", text);

    // Now group words around anchor words 'Prime' and 'Forma'
    const anchorWords = ["prime", "forma"];
    const anchorGroups = groupWordsByAnchor(words, anchorWords);
    console.log(anchorGroups)
    //return { text, anchorGroups };
    return text;
  } catch (error) {
    console.error("Error in OCR processing:", error);
    //return { text: "", anchorGroups: [] };
    return null;
  }
}


function groupWordsByAnchor(words, anchorWords, maxDistance = 80) {
  // We'll treat anchorWords as lowercase for matching
  const anchors = anchorWords.map(a => a.toLowerCase());
  
  // This will store { anchor: wordObject, words: [ ... ] }
  const groups = [];

  for (const w of words) {
    // Normalize text (remove punctuation, lowercase)
    const cleanedText = w.text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    // We'll calculate the word's center coordinates
    const wX = (w.bbox.x0 + w.bbox.x1) / 2;
    const wY = (w.bbox.y0 + w.bbox.y1) / 2;

    // Check if this word is an anchor
    if (anchors.includes(cleanedText)) {
      // Create a new group with this as the anchor
      groups.push({
        anchor: w,       // The anchor word object
        words: [w],      // Start the group with the anchor word
      });
    } else {
      // If not an anchor, see if it's near any existing anchor
      let foundGroup = null;
      let minDist = Infinity;

      for (const group of groups) {
        const a = group.anchor;
        // Anchor center
        const aX = (a.bbox.x0 + a.bbox.x1) / 2;
        const aY = (a.bbox.y0 + a.bbox.y1) / 2;

        // Euclidean distance
        const dx = aX - wX;
        const dy = aY - wY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Keep track of nearest anchor group
        if (dist < minDist && dist < maxDistance) {
          minDist = dist;
          foundGroup = group;
        }
      }

      // If close enough to an anchor, add it to that group
      if (foundGroup) {
        foundGroup.words.push(w);
      }
      // Otherwise, it's unanchored and won't be in any group
    }
  }

  return groups;
}


ipcMain.handle("perform-ocr", async (event, imagePath, dimensions) => {
  console.log(dimensions)
  const ocrResult = await processImageOCR(imagePath, dimensions);
  console.log(ocrResult);
  return ocrResult;
});


