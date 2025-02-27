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
      return "";
    }
    // Read the image using sharp.
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Crop and preprocess the image.
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
ipcMain.handle("perform-ocr", async (event, imagePath, dimensions) => {
  console.log(dimensions)
  const ocrResult = await processImageOCR(imagePath, dimensions);
  console.log(ocrResult);
  return ocrResult;
});

