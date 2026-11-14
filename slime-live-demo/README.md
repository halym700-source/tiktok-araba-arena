# Slime Live — Recep-themed interactive slime stream

A vertical 9:16 browser scene plus a local Node.js TikTok LIVE event bridge for OBS.

## Current scene
- Host character is a temporary procedural 3D cartoon stand-in, not a finished likeness or rigged production model.
- Shallow transparent çiğköfte-tray-style bowl on a minimally visible table; host is staged behind it.
- Slime reacts to water, borax, foam, color, tea, finger-heart, perfume, hand-heart and work/tilt gifts.
- Turkish voice reactions use the browser's speech synthesis when a Turkish voice is installed.
- Test gift buttons are included in the browser scene.

## Gift mapping
- Water / Rose / Gül: thins slime; repeat thresholds: 1–5, 6–10 and 20–30 trigger the supplied Turkish lines.
- Borax / Boraks: changes slime consistency/elasticity.
- Foam / Köpük: increases slime volume.
- Color / Renk: chooses a random color.
- Tea / Çay: kettle-pour animation, brown tint and slight thinning.
- Finger Heart / Finger: spoken reaction.
- Perfume / Parfüm: larger foam/volume effect and spoken reaction.
- Hand Heart / Elle Kalp: random color plus sung-style spoken line.
- Work / İş Gücü: tilts the tray/table prop to simulate pouring to the side.

Gift-name detection is best-effort and depends on the gift names exposed by the third-party TikTok connector. Confirm actual LIVE gift names in a private test before going public.

## Run locally (PC required)
1. Install Node.js 20 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Set your TikTok LIVE username (without @):
   - macOS/Linux: `TIKTOK_USERNAME=your_username npm start`
   - Windows PowerShell: `$env:TIKTOK_USERNAME="your_username"; npm start`
5. In OBS add a Browser Source: `http://localhost:3001`, width `1080`, height `1920`.

Without TIKTOK_USERNAME, the scene starts in test mode. Test a gift using:
`POST http://localhost:3001/test-gift` with JSON such as `{"kind":"tea","username":"Mehmet"}`.

## Important production notes
- GitHub Pages hosts only the static preview. It cannot run the Node.js bridge or receive live TikTok events.
- The connector is an unofficial community integration, not an official TikTok API. Compatibility may change; do not use it to bypass TikTok access controls.
- Never enter TikTok passwords, cookies, or verification codes into this project.
- A real, high-quality custom 3D character with facial rigging, hand animation and reliable lip sync is not yet included. The current host is a procedural placeholder.
- For a public LIVE, verify the local bridge, OBS capture, sound levels, moderation and gift-name mapping in a private test first.
- Do not present borax or any other chemical as safe to ingest or use on skin; keep materials away from viewers and children.
