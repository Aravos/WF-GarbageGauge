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

async function processImageOCR(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return { text: "", anchorGroups: [] };
    }

    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const croppedBuffer = await image
      .modulate({
        brightness: 0.5,
        saturation: 2
      })
      .extract({
        left: Math.floor(metadata.width * dimensions[0]),
        top: Math.floor(metadata.height * dimensions[1]),
        width: Math.floor(metadata.width * dimensions[2]),
        height: Math.floor(metadata.height * dimensions[3]),
      })
      .gamma(3)
      .greyscale()
      .median(1)
      .toBuffer();

    await sharp(croppedBuffer).toFile(path.join(__dirname, "final.png"));
    console.log("Final image saved as final.png.");

    const worker = await createWorker("eng");
    const { data } = await worker.recognize(croppedBuffer, {}, {
      words: true,
      blocks: true,
      layout: true,
      hocr: true,
      tsv: true
    });

    const extractedWords = extractWordsFromTSV(data.tsv);
    await worker.terminate();

    console.log("OCR completed. Recognized text:", data.text);
    const text = (data.text).toLowerCase();

    const anchorWords = new Set(["prime", "forma"]);
    const anchorGroups = groupWordsByAnchor(extractedWords, anchorWords);

    return { text, anchorGroups };
  } catch (error) {
    console.error("Error in OCR processing:", error);
    return null;
  }
}

function groupWordsByAnchor(words, anchor, radius = 120) {
  const groups = [];
  words.forEach(w => {
    const cleanedText = w.text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anchor.has(cleanedText)) {
      groups.push({
        anchor: w,
        words: [w]
      });
    }
  });
  
  words.forEach(w => {
    const cleanedText = w.text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anchor.has(cleanedText)) return;

    // Center of the current word.
    const wCenterX = (w.bbox.x0 + w.bbox.x1) / 2;
    const wCenterY = (w.bbox.y0 + w.bbox.y1) / 2;

    let closestGroup = null;
    let minDist = Infinity;

    groups.forEach(group => {
      // Calculate the center of the anchor.
      const a = group.anchor;
      const aCenterX = (a.bbox.x0 + a.bbox.x1) / 2;
      const aCenterY = (a.bbox.y0 + a.bbox.y1) / 2;
      const dx = aCenterX - wCenterX;
      const dy = aCenterY - wCenterY;
      // Euclidean Distance
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius && dist < minDist) {
        minDist = dist;
        closestGroup = group;
      }
    });

    if (closestGroup) {
      closestGroup.words.push(w);
    }
  });
  return groups;
}

function extractWordsFromTSV(tsvData) {
  let words = [];
  const lines = tsvData.split("\n");

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 12) {
      const text = parts[11]; // Use the 12th column for the recognized word
      const bbox = {
        x0: parseInt(parts[6], 10),
        y0: parseInt(parts[7], 10),
        x1: parseInt(parts[8], 10),
        y1: parseInt(parts[9], 10)
      };
      if (text.trim()) words.push({ text, bbox });
    }
  }
  return words;
}

ipcMain.handle("perform-ocr", async (event, imagePath) => {
  const { text, anchorGroups } = await processImageOCR(imagePath);
  return { text, anchorGroups };
});
