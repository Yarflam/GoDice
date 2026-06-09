# 🎲 GoDice Controller

A modern, dark-themed web controller for **GoDice** — Bluetooth-connected smart dice. Control your dice LEDs, track rolls, and customize colors with an elegant real-time interface.

![GoDice Controller](images/godice.png)

## ✨ Features

### 🎨 Modern Dark UI
Sleek dark theme with purple accents, animated cards, and responsive design. Works on desktop and mobile.

### 💡 LED Control
- **Color Picker** — Choose any RGB color for your dice LEDs
- **4 Lighting Modes:**
  - 🔴 **Off** — LEDs disabled
  - 🟢 **On** — Solid color, always lit
  - 🟡 **Pulse** — Rhythmic pulsing with 3 speed presets (Slow / Normal / Fast)
  - 🔵 **Conditional** — LED color changes automatically based on the rolled value

### 🎯 Conditional Colors
Assign a different LED color to each die face (1-6). When you roll, the die lights up with the color matching the outcome. Perfect for visual feedback during games!

### 🌍 Internationalization
Switch between **French** and **English** instantly. All UI text, color names, and labels are translated. Language preference is persisted in `localStorage`.

### 💾 Per-Dice Persistence
Each die's settings (LED color, mode, pulse speed, conditional colors) are saved in `localStorage` and restored automatically when reconnecting the same die.

### 🔋 Battery Indicator
Click the battery badge in the top-right corner of any die card to refresh and display the current battery percentage.

### 🎲 Auto-Reconnect
If a die disconnects, the app automatically attempts to reconnect in the background.

### 🎰 Die Type Support
Supports all GoDice shells: **D6, D4, D8, D10, D10X, D12, D20**.

---

## 🚀 Getting Started

1. Open `index.html` in a **Chrome** or **Microsoft Edge** browser (Bluetooth Web API required)
2. Click **"Connect a die"** and pair your GoDice via Bluetooth
3. Customize colors and lighting modes from the die card

> ⚠️ **Note:** The Web Bluetooth API is only available in secure contexts (HTTPS or localhost) and supported browsers.

---

## 📁 Project Structure

```
├── index.html          # Main demo UI
├── style.css           # Modern dark theme styles
├── main.js             # Demo controller logic (LED modes, i18n, persistence)
├── godice.js           # Core GoDice BLE API class
├── lang.js             # i18n translations (FR / EN)
├── API.md              # Technical API documentation
└── images/             # Logo and assets
```

---

## 🛠️ Technical Stack

- **Vanilla JavaScript** — No frameworks, pure DOM manipulation
- **Web Bluetooth API** — For BLE communication with GoDice
- **CSS Grid & Flexbox** — Responsive card layout
- **LocalStorage** — Persistence of per-dice settings
- **Custom i18n engine** — Lightweight translation system

---

## 📚 API Documentation

For technical details on integrating the GoDice JavaScript API into your own projects, see [**API.md**](API.md).

---

## 📝 License

This project is licensed under the terms of the original GoDice JavaScript API.
