// capture.js
const { desktopCapturer, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const targetWindowName = "Warframe"; // You can use this to filter, if needed

async function captureScreen() {
  // Get the primary display's work area size
  const { workAreaSize } = screen.getPrimaryDisplay();

  // Options object for getSources
  const options = {
    types: ["screen"], // Change to ["window"] if you want a specific window
    thumbnailSize: {
      width: workAreaSize.width,
      height: workAreaSize.height,
    },
  };

  // Call desktopCapturer.getSources() to get an array of sources
  const sources = await desktopCapturer.getSources(options);
  
  if (!sources.length) {
    throw new Error("No screen sources found.");
  }

  // For now, just pick the first source
  // (You can add filtering here using targetWindowName if needed)
  const screenSource = sources[0];

  // Convert the thumbnail to a PNG Buffer
  const imageBuffer = screenSource.thumbnail.toPNG();

  // Save the screenshot image as a PNG file
  const filePath = path.join(__dirname, "screenshot.png");
  fs.writeFileSync(filePath, imageBuffer);
  console.log("Screenshot saved at:", filePath);
  return filePath;
}

module.exports = { captureScreen };