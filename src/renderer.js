console.log("renderer.js is loaded!");

document.addEventListener("DOMContentLoaded", () => {
    const listElement = document.getElementById("item-list");
    fetch("https://api.warframe.market/v1/items").then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
        })
        .then((data) => {
        const items = data.payload.items;
        items.forEach((item) => {
            const itemName = item.item_name ? item.item_name : "Unknown Item";

            const button = document.createElement("button");
            button.setAttribute("data-item-name", itemName);
            button.textContent = itemName;

            listElement.appendChild(button);
        });
        })
        .catch((error) => {
        console.error("Error fetching items:", error);
        listElement.textContent = "Failed to load items.";
        });

    listElement.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
        window.api.captureScreen();
        const itemName = event.target.getAttribute("data-item-name");
        console.log(`Button clicked: ${itemName}`);
        }
    });
});
