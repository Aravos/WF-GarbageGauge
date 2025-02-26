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
      return "";
    }
    // Read the image using sharp.
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Crop and preprocess the image.
    const croppedBuffer = await image
      .extract({
        left: Math.floor(metadata.width * 0.25),
        top: Math.floor(metadata.height * 0.38),
        width: Math.floor(metadata.width * 0.5),
        height: Math.floor(metadata.height * 0.05),
      })
      .greyscale()
      .gamma(2)
      .toBuffer();
    console.log("Image preprocessed successfully.");


    // image for debugging.
    await sharp(croppedBuffer).toFile(path.join(__dirname, "final.png"));
    console.log("Final image saved as final.png.");

    // Create and initialize the Tesseract worker.
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(croppedBuffer);
    await worker.terminate();

    console.log("OCR completed. Recognized text:", text);
    return text;
  } catch (error) {
    console.error("Error in OCR processing:", error);
    return "";
  }
}
ipcMain.handle("perform-ocr", async (event, imagePath) => {
  const ocrResult = await processImageOCR(imagePath);
  console.log(ocrResult);
  return ocrResult;
});

