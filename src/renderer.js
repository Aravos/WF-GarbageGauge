// renderer.js
document.addEventListener("DOMContentLoaded", () => {
    const listElement = document.getElementById("item-list");
  
    // Fetch the list of tradable items from Warframe.market API
    fetch("https://api.warframe.market/v1/items", {
      headers: {
        "Language": "en"
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const items = data.payload.items;
        items.forEach((item) => {
          // Use the English item name if available; otherwise, default to 'Unknown Item'
          const itemName = item.item_name ? item.item_name : "Unknown Item";
          // Create a button element for the item
          const button = document.createElement("button");
          button.textContent = itemName;
          button.setAttribute("data-item-name", itemName);
          listElement.appendChild(button);
        });
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        listElement.textContent = "Failed to load items.";
      });
  
    // Listen for button clicks on the item list
    listElement.addEventListener("click", async (event) => {
      if (event.target.tagName === "BUTTON") {
        const itemName = event.target.getAttribute("data-item-name");
        console.log(`Button clicked: ${itemName}`);
        try {
          const filePath = await window.api.captureScreen();
          console.log(`Screenshot saved at: ${filePath}`);
        } catch (error) {
          console.error("Failed to capture screen:", error);
        }
      }
    });
  });
  