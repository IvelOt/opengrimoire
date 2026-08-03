# OpenGrimoire — Constitution

This repository is **OpenGrimoire**: a simple, modern, international, and 100% offline D&D 5th Edition character sheet manager.

> This project was adopted by `ai_bridge_brain`. Any agentic CLI or editor (Claude Code, Codex, Gemini CLI, opencode, Cursor, VS Code…) must read this file before acting.

## Context & Architecture

- **Goal:** Provide a lightweight, fast, and server-independent tabletop RPG character manager, focused on simplicity and user experience.
- **Architecture:** Client-side only Single Page Application (SPA). Data is stored entirely in the browser's `localStorage`. No server-side logic or database is used.
- **Core Files:** See the File Structure section in `README.md`.

## Tech Stack & Frozen Versions

No package manager or build system is used. All dependencies are loaded via CDN or are native browser APIs.

- **Language:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Dependencies (CDN):** See the Technologies Used section in `README.md`.
- **Data Storage:** `localStorage` (JSON serialization) with in-memory fallback for strict/incognito modes.

## Development Workflow

This is a pure front-end project with no build step.

### Setup & Run
1. No installation required.
2. Open `index.html` in any modern web browser to start the app.
3. For local development with live reloading, you can use an extension like VS Code Live Server or run a simple local HTTP server (`python3 -m http.server` or `npx serve`).

### Build & Deploy
- **Build:** No build step. The files in the repository are production-ready.
- **Deploy:** Host via GitHub Pages by serving the repository root.

### Testing
- **Status:** Currently, there are no automated tests.
- **Debt:** Test coverage is missing. Manual testing in the browser is required for all changes.

## Non-negotiable Rules

1. **No Backend:** The application must remain 100% offline and server-independent. All features must rely on client-side APIs (like `localStorage` or `IndexedDB` if needed in the future).
2. **Vanilla JS Only:** Do not introduce heavy front-end frameworks (React, Vue, Angular) or complex build tools (Webpack, Vite) without explicit user permission. The project aims to remain lightweight and accessible.
3. **Responsive Design:** All UI changes must be mobile-friendly and utilize the established CSS Grid/Flexbox layout systems.
4. **Internationalization:** Any new text added to the UI must be mapped in `language.js` and support both PT-BR and EN-US. Use the `data-i18n` attribute in HTML.
5. **Secrets:** (N/A) The project uses no external authenticated APIs and requires no secrets or environment variables.