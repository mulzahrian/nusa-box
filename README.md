# City Empire: Modern Metropolis

A modern, browser-based **city builder + simulation** built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).
Build roads, zone districts, manage utilities, watch citizens move in, and grow a village into a thriving metropolis.

## Features

- 🏙️ Grid-based 3D city with low-poly modern visuals
- 🛣️ Roads, residential / commercial / industrial / office zones
- ⚡ Utilities: power plants & water (with grid coverage)
- 🌳 Parks, schools, hospitals, police, fire stations
- 👥 Citizen simulation (name, age, job, education, happiness)
- 💸 Live economy: taxes, expenses, treasury
- 😀 Happiness system driven by services, pollution, traffic
- 🚦 Traffic & vehicle simulation along the road network
- 🌦️ Weather & seasons
- 🌪️ Random disasters (fire, earthquake, flood)
- 🏛️ Districts, Smart City controls, City Dashboard
- 🗺️ Mini-map with multiple overlays
- 💾 Save / load via localStorage

## Quick start

```bash
npm install
npm run dev
```

Then open the printed URL (default `http://localhost:5173`).

## Controls

| Action                | Input                                  |
| --------------------- | -------------------------------------- |
| Rotate camera         | Right mouse drag                        |
| Pan camera            | Middle mouse drag / WASD / Arrow keys   |
| Zoom                  | Mouse wheel                             |
| Place / paint         | Left click (drag for roads & zones)     |
| Bulldoze              | Select 🚧 *Bulldoze* tool, then click   |
| Cancel tool / Close   | `Esc`                                   |
| Pause / Speed         | Buttons in top bar or `1` `2` `3` `0`  |

## Project structure

```
src/
├── main.js                  # Bootstrap
├── config/                  # Static game data (buildings, zones, constants)
├── core/                    # Game loop, engine, event bus
├── world/                   # Grid, tiles, terrain, skybox
├── entities/                # Building / Road / Vehicle / Citizen
├── systems/                 # Economy, Population, Traffic, Happiness…
├── rendering/               # Renderer, camera, lighting, mesh factories
├── input/                   # Input + build tool state machine
├── ui/                      # All HUD panels (vanilla DOM components)
├── utils/                   # Math, RNG, storage helpers
└── styles/                  # CSS for menus and HUD
```

Each system is decoupled and communicates through a global `EventBus`,
so new mechanics can be added without touching the core loop.

## Roadmap

- Multiplayer mode
- Workshop / mod loader
- Detailed supply chain visualization
- Politics & elections subsystem

---

© City Empire. Built for learning & fun.
