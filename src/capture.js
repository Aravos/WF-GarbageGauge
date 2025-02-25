const { desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");

async function captureScreen() {
    // const sources = await desktopCapturer.getSources({ types: ["window", "screen"] });
    // const windowSource = sources.find(source => source.name === "Your Window Name");
    const sources = await desktopCapturer.getSources({ types: ["screen"] });

    if (sources.length === 0) {
        console.error("No screen sources found.");
        return;
    }

    const screenSource = sources[0];
    const image = screenSource.thumbnail.toPNG();

    const filePath = path.join(__dirname, "screenshot.png");
    fs.writeFile(filePath, image, (err) => {
        if (err) console.error("Error saving screenshot:", err);
        else console.log("Screenshot saved at:", filePath);
    });
}

module.exports = { captureScreen };
