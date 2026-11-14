# Slime Live — local LIVE bridge

This folder contains the browser scene and a local Node.js bridge for OBS.

## Run locally (PC required)

1. Install Node.js 20 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Set your TikTok LIVE username (without @):
   - macOS/Linux: `TIKTOK_USERNAME=your_username npm start`
   - Windows PowerShell: `$env:TIKTOK_USERNAME="your_username"; npm start`
5. Open `http://localhost:3001` in OBS as a Browser Source (1080 × 1920).

Without TIKTOK_USERNAME, the scene still starts and test gifts can be sent from:
`POST http://localhost:3001/test-gift` with JSON `{"kind":"rose","username":"Mehmet"}`.

## Gift mapping
- Rose / Gül → water
- Heart / Kalp → pink dye
- Flower / Çiçek → beads
- Diamond / Elmas → glitter
- Lion / Aslan → mega glitter

Unknown gifts are displayed as a celebration only; they do not trigger a large animation.

## Important limitations
- TikTok LIVE Connector is an unofficial community integration, not an official TikTok API. Availability and compatibility can change.
- This bridge does not request or store TikTok passwords, cookies, or session tokens.
- GitHub Pages can host the static preview, but it cannot run this Node.js bridge. Real LIVE events require this server to run on a PC/VPS reachable by the browser scene.
- The current 3D host is still a temporary placeholder. A custom, rigged character model and full deformable slime physics are separate production tasks and require visual references plus a capable PC/GPU.
