const { desktopCapturer, screen } = require("electron");
const fs = require("fs");
const path = require("path");

async function captureScreen() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const options = {
    types: ["screen"],
    thumbnailSize: {
      width: workAreaSize.width,
      height: workAreaSize.height,
    },
  };

  const sources = await desktopCapturer.getSources(options);
  if (!sources.length) {
    throw new Error("No screen sources found.");
  }
  const screenSource = sources[0];
  const imageBuffer = screenSource.thumbnail.toPNG();
  const filePath = path.join(__dirname, "screenshot.png");
  fs.writeFileSync(filePath, imageBuffer);
  console.log("Screenshot saved at:", filePath);
  return filePath;
}

module.exports = { captureScreen };