// renderer.js
document.addEventListener("DOMContentLoaded", () => {
    const captureButton = document.getElementById("capture-button");
    
    captureButton.addEventListener("click", () => {
      console.log("CAPTURE INITIATED");
      window.api.captureScreen().then(filePath => {
        console.log("Screenshot saved at:", filePath);
      }).catch( err => {
        console.error("Error capturing screen:", err);
      })
    })
  });
  
  