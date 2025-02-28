const { app, BrowserWindow, ipcMain, screen } = require("electron");
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
      nodeIntegration: true
    }
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

async function processImageOCR(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return { text: "", anchorGroups: [] };
    }
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const croppedBuffer = await image
      .extract({
        left: Math.floor(metadata.width * 0.1),
        top: Math.floor(metadata.height * 0.1),
        width: Math.floor(metadata.width * 0.8),
        height: Math.floor(metadata.height * 0.8)
      })
      .modulate({
        brightness: 0.5,
        saturation: 1.0
      })
      .greyscale()
      .normalize()
      .threshold(125)
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
    const text = data.text.toLowerCase();
    const anchorWords = new Set(["prime", "forma"]);
    const anchorGroups = groupWordsByAnchor(extractedWords, anchorWords);
    console.log("Text: ",text);
    console.log("Detailed Anchor Groups:");
    anchorGroups.forEach((group, index) => {
      console.log(`Group ${index + 1}:`);
      console.log(`  Anchor: ${group.anchor.text}`);
      group.words.forEach((word, idx) => {
        console.log(`    Word ${idx + 1}: ${word.text}`);
      });
    });
    return { text, anchorGroups };
  } catch (error) {
    console.error("Error in OCR processing:", error);
    return null;
  }
}

function groupWordsByAnchor(words, anchorSet, radius = 120) {
  const groups = [];
  words.forEach(w => {
    if (anchorSet.has(w.text)) {
      groups.push({ anchor: w, words: [w] });
    }
  });

  words.forEach(w => {
    if (anchorSet.has(w.text)) return;
    if (global.validWordsSet.has(w.text)) {
      const wCenterX = (w.bbox.x0 + w.bbox.x1) / 2;
      const wCenterY = (w.bbox.y0 + w.bbox.y1) / 2;

      let closestGroup = null;
      let minDist = Infinity;

      groups.forEach(group => {
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
    }
  });

  return groups;
}


function extractWordsFromTSV(tsvData) {
  const words = [];
  const lines = tsvData.split("\n");
  
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 12) {
      const rawText = parts[11].trim();
      const cleanedText = rawText.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (!cleanedText) continue;
      
      const bbox = {
        x0: parseInt(parts[6], 10),
        y0: parseInt(parts[7], 10),
        x1: parseInt(parts[8], 10),
        y1: parseInt(parts[9], 10)
      };
      
      words.push({ text: cleanedText, bbox });
    }
  }
  
  return words;
}
ipcMain.handle("perform-ocr", async (event, imagePath) => {
  const { text, anchorGroups } = await processImageOCR(imagePath);
  return { text, anchorGroups };
});

ipcMain.handle("set-valid-words", async (event, validWordsArray) => {
  global.validWordsSet = new Set(validWordsArray);
  return { status: "success" };
});
