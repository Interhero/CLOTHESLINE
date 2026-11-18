# Smart Clothesline Prototype (ENT600)

An Apple Home-inspired interactive smart clothesline simulation and dashboard built for ENT600 Technology Entrepreneurship Final Project.

![Apple Home UI](https://img.shields.io/badge/UI-Apple_Home_Glassmorphism-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)

---

## ✨ Features

- **Apple Home Design Language**:
  - Translucent frosted glass tiles (`glass-tile-inactive`) and solid white active states (`glass-tile-active`).
  - Native squircle borders, dynamic system status badges, and telemetry tiles.
- **Physical Rack Simulation**:
  - Integrated high-tech blower fan in the main wall unit between SMART and DRY badges.
  - Straight horizontal airflow streams directed across the rods.
  - Auto fan shut-off protection when rack is retracted/folded against the wall (`<= 5%`).
  - Realistic clothes load simulation with responsive fabric sway physics.
- **3-Tier Power Management**:
  - Read-only **Power Status** accessory tile turning white when system is operational.
  - `Standby`, `Online`, and `Offline` states with dedicated **Scene Demo Switcher** for presentations.
- **Intelligent Sensors & Weather Telemetry**:
  - Thermostat & ambient weather conditions.
  - Rain sensor with automated 25% rain-safe retraction guard.
  - Strain gauge laundry load cell dynamically updating based on selected mode (e.g. 4.6 kg for Heavy Laundry).
- **Scenes & Presets**:
  - Quick Dry (90m, 2.4kg)
  - Delicate Fabrics (120m, 1.5kg)
  - Heavy Laundry (180m, 4.6kg)
  - Eco Air-Dry (240m, 2.2kg)
  - Night Silent (120m, 1.8kg)
- **Standalone Version**: Includes `standalone.html` (single-file, zero-dependency distribution running directly in any modern browser).

---

## 🚀 Getting Started

### Option 1: Standalone Single File (No Installation Required)
Simply double click or open `standalone.html` in Chrome, Edge, Safari, or Firefox.

### Option 2: Run with Vite & Node.js
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

---

## 🛠 Tech Stack
- **Framework**: React 18
- **Tooling**: Vite 6
- **Styling**: Tailwind CSS, Lucide Icons
- **Simulation**: Custom React Hooks & SVG Animation Engine

