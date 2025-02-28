# Warframe Relic Runner

**Warframe Relic Runner** is an overlay tool for Warframe that helps you quickly evaluate the average Platinum value of relic rewards, making it easier to decide which Prime Part to select.

---

## 📌 Features

- 📸 **Screenshot Capture** – Captures a screenshot when you crack open a relic.
- 🔍 **OCR Extraction** – Uses Tesseract.js to automatically detect and parse Prime part text.
- 💰 **Market Price Lookup** – Fetches the average market value from Warframe Market.
- ✅ **Informed Decision Making** – Displays Prime Part values on-screen to help you choose the best reward.
- 👥 **Team Support** – Works in solo play or teams of 1–4 players.
- ⭐ **High-Value Relic Highlighting** – The most valuable relic reward is highlighted in **gold**, while others appear in **bronze**.
- ⚖ **TOS Friendly** – This tool only captures screenshots and does **not** read game memory, making it compliant with Warframe’s Terms of Service.
- 🖥 **Automatic Capture** – No need to select or adjust a capture area; the overlay handles various screen sizes seamlessly.

---

## 🛠 Installation & Setup

### 🔽 Clone the Repository
```sh
git clone https://github.com/Aravos/Warframe-RelicRunner.git
cd Warframe-RelicRunner
```

### 📦 Install Dependencies
```sh
npm install
```

### ▶ Run the Application
```sh
npm run
```

---

## 🎮 Usage Guide

1. **Launch Warframe** as usual.
2. **Open the overlay application.**
3. When you crack open a relic, click **Capture Screenshot** in the overlay.
4. Wait a few seconds for the market values to load on-screen.
5. **Choose the Prime part** based on the displayed Platinum value.
6. **Golden Text = Highest Value Item** 🏆
   - The **most valuable Prime part** is highlighted with **golden glowing text**.
   - All other relic rewards appear in **bronze text**.
7. Click **Clear** to reset the overlay.
8. The overlay **automatically** captures relic rewards using anchor words, so there’s no need to adjust the screen area.
9. Repeat the process for each relic.

---

<table>
  <tr>
    <th style="text-align:center;">Overlay</th>
    <th style="text-align:center;">Four Squad Prime Selection</th>
  </tr>
  <tr>
    <td><img src="screenshots/1.webp" alt="Overlay Example"></td>
    <td><img src="screenshots/2.webp" alt="Prime Part Selection"></td>
  </tr>
</table>

<table>
  <tr>
    <th style="text-align:center;">Three Squad</th>
    <th style="text-align:center;">Two Squad</th>
  </tr>
  <tr>
    <td><img src="screenshots/3.webp" alt="3-Person Squad"></td>
    <td><img src="screenshots/4.webp" alt="2-Person Squad"></td>
  </tr>
</table>

<table>
  <tr>
    <th style="text-align:center;">Duplicate Rewards</th>
  </tr>
  <tr>
    <td><img src="screenshots/5.webp" alt="Duplicates"></td>
  </tr>
</table>

---
## 🔧 Technologies Used
- ⚡ **Electron.js** – For creating the overlay.
- 🧠 **Tesseract.js** – For Optical Character Recognition (OCR).
- 🖼 **Sharp** – For image processing.
- 🌐 **Node.js** – Backend processing and file system access.
- 📊 **Warframe Market API** – Fetching real-time Platinum prices.
- 🎨 **HTML, CSS, JavaScript** – Frontend design and user interaction.

---

## 📜 License
This project is licensed under the **MIT License**.