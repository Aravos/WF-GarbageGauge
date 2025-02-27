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
  console.log("Dimensions:", dimensions);
  try {
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return { text: "", anchorGroups: [] };
    }

    // Preprocess the image with Sharp
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const croppedBuffer = await image
      .extract({
        left: Math.floor(metadata.width * dimensions[0]),
        top: Math.floor(metadata.height * dimensions[1]),
        width: Math.floor(metadata.width * dimensions[2]),
        height: Math.floor(metadata.height * dimensions[3]),
      })
      .modulate({
        brightness: 0.01,
        saturation: 2
      })
      .gamma(3)
      .greyscale()
      .median(1)
      .toBuffer();

    await sharp(croppedBuffer).toFile(path.join(__dirname, "final.png"));
    console.log("Final image saved as final.png.");

    // Use Tesseract to get bounding box data (with TSV output)
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(croppedBuffer, {}, {
      words: true,
      blocks: true,
      layout: true,
      hocr: true,
      tsv: true
    });

    // Extract words (with coordinates) from the TSV data
    const extractedWords = extractWordsFromTSV(data.tsv);
    // console.log("Extracted words:", extractedWords);
    // console.log("Blocks:", data.blocks);
    // console.log("LayoutBlocks:", data.layoutBlocks);
    // console.log("Lines:", data.lines);
    // console.log("Paragraphs:", data.paragraphs);

    await worker.terminate();

    console.log("OCR completed. Recognized text:", data.text);
    const text = (data.text).toLowerCase();

    // Group words around anchor words 'prime' and 'forma'
    const anchorWords = ["prime", "forma"];
    const anchorGroups = groupWordsByAnchor(extractedWords, anchorWords);

    return { text, anchorGroups };
  } catch (error) {
    console.error("Error in OCR processing:", error);
    return null;
  }
}

/**
 * Groups words by the closest anchor.
 * Each word is compared to any anchor word (matched by lowercase cleaned text).
 * If a word is within maxDistance from an anchor’s center, it is added to that anchor's group.
 */
function groupWordsByAnchor(words, anchorKeywords, radius = 120) {
  // Convert anchor keywords to lowercase for matching.
  const anchorsLower = anchorKeywords.map(a => a.toLowerCase());
  
  // First, build groups for anchor words.
  const groups = [];
  words.forEach(w => {
    const cleanedText = w.text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anchorsLower.includes(cleanedText)) {
      groups.push({
        anchor: w,
        words: [w]
      });
    }
  });

  // Now, assign each non-anchor word to the closest anchor within the radius.
  words.forEach(w => {
    const cleanedText = w.text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (anchorsLower.includes(cleanedText)) return; // Skip anchor words themselves

    // Calculate the center of the current word.
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


/**
 * Extracts words and bounding box coordinates from TSV data.
 * Expects TSV lines where columns 7,8,9,10 represent x0, y0, width, and height.
 * The recognized word is in column 12 (index 11).
 */
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

ipcMain.handle("perform-ocr", async (event, imagePath, dimensions) => {
  const { text, anchorGroups } = await processImageOCR(imagePath, dimensions);
  console.log("passed 1")
  return { text, anchorGroups };
});
