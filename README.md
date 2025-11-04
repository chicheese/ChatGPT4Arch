# ChatGPT4Arch

A lightweight Electron wrapper that gives ChatGPT a native-feeling desktop client on Arch-based Linux distributions. The app embeds `https://chatgpt.com`, keeps you signed in between launches, and respects the system appearance so it blends in with Sway, Garuda Dragonized, and other Arch environments.

## Features

- Loads ChatGPT in an Electron window with minimal chrome.
- Remembers authentication cookies and session storage between runs (handled by Electron).
- Sets window defaults that feel at home on tiling and traditional desktops.
- Fallback HTML page when ChatGPT cannot be reached.
- Cross-platform friendly while focusing on Arch Linux.

## Requirements

- Node.js 18+ (LTS recommended). `nvm` makes switching versions easy.
- npm 9+.
- Git & SSH access to GitHub for development.

```bash
nvm install --lts
nvm use --lts
```

## Getting Started

Clone the repository and install dependencies:

```bash
git clone git@github.com:chicheese/ChatGPT4Arch.git
cd ChatGPT4Arch
npm install
```

Launch the development build:

```bash
npm start
```

Electron will open a window and load `chatgpt.com`. If the network is unavailable, you'll see a friendly offline fallback page with a reload button.

## Project Structure

```
ChatGPT4Arch/
├── main.js         # Electron main process
├── preload.js      # Context isolated bridge (reserved for future use)
├── index.html      # Offline fallback page
├── package.json
└── node_modules
```

## Roadmap

The roadmap tracks the planned improvements for the MVP and beyond:

1. **Window polish**: persist size/position, add tray integration where supported, expose a reload shortcut.
2. **Visual updates**: optional frameless layout, custom title bar, refined styling.
3. **Settings & integrations**: preferences screen, theme toggle, always-on-top mode.
4. **Packaging**: produce `.AppImage`/`.deb` builds and verify on Garuda Sway + Dragonized.

Progress is tracked locally in `Progress.md` (ignored in Git so personal notes stay private).

## Development Notes

- The app uses Electron's default session to store cookies; no extra code needed for persistence yet.
- `preload.js` is currently a no-op but keeps the door open for secure renderer integrations later.
- Contributions are welcome; open an issue or submit a pull request with your changes.

## License

MIT © chicheese
