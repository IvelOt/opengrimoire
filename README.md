# OpenGrimoire

> Test here -> [Demo](https://levirenato.github.io/opengrimoire/)

> A simple, modern, international, and 100% offline D&D 5th Edition character sheet manager.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)
![Tech](https://img.shields.io/badge/tech-HTML%20%7C%20CSS%20%7C%20JS-orange.svg)

## About the Project

**OpenGrimoire** is a web application focused on simplicity and user experience for managing tabletop RPG characters.

Unlike complex platforms, this project was built to be **lightweight**, **fast**, and **totally server-independent**. All your data is saved in your own browser or in JSON files that you control.

### Key Features

- ** Internationalization (i18n):** Full support for **Portuguese (BR)** and **English (US)** with instant switching.
- ** PDF Export:** Generate your character sheet in the official 5e model, with guaranteed formatting (flattened forms) for perfect printing.
- ** Local Persistence:** Everything is saved automatically in the browser's `LocalStorage`. Nothing goes to the cloud.
- ** Mobile Optimized Layout:**
  - On PC: 3-column view (dashboard style).
  - On Mobile: Intelligent priority order (Health/Combat at the top → Attributes → Equipment → Spells).
- ** Dynamic Themes:** Switch between **Parchment (Light)** and **Cave (Dark)** modes.
- ** Customization:** Choose individual highlight color (theme) for each character.
- ** Dynamic Spells:** The spell slot list expands automatically (Levels 1 to 9) based on character level.
- ** Intelligent Automation:** Automatic calculation of attribute modifiers.
- ** Import & Export:** Complete backup via JSON, including the avatar image.

---

## Screenshots

<img width="1345" height="737" alt="image" src="https://github.com/user-attachments/assets/672f3cd3-053e-4d66-8e98-91105b09e59d" />

<img width="1350" height="746" alt="image" src="https://github.com/user-attachments/assets/05dbaeaa-c59c-4e0a-8f1f-af027690489a" />

## Demo

https://github.com/user-attachments/assets/fe9090a7-4a8e-43a6-9c77-82518b703ec4


---

## How to Use

No installation required (Node, Python, PHP, etc). It is pure front-end!

### Option 1: Running Locally

1. Download this repository.
2. Open the `index.html` file in any modern browser (Chrome, Firefox, Edge).
3. Done!

### Option 2: Hosting (GitHub Pages)

Just upload the files to a GitHub repository and enable **GitHub Pages** in the settings. The project is already optimized to run at the root.

---

## File Structure

The project maintains simplicity but is now modularized:

- `index.html`: Semantic structure, layout, and internationalization tags (`data-i18n`).
- `style.css`: Design System, CSS variables, Grid Layout, and Media Queries for mobile ordering.
- `script.js`: Core logic (CRUD, Calculations, UI).
- `language.js`: Translation dictionary and language switching logic.
- `pdf-exporter.js`: Integration with `pdf-lib` to generate the filled official PDF.

---

## Technologies Used & Versions

- Semantic **HTML5**.
- Modern **CSS3** (CSS Variables, Flexbox, Grid, Glassmorphism).
- **Vanilla JavaScript (ES6+)** without frameworks.
- **PDF-Lib** (v1.17.1 via CDN) for PDF manipulation.
- **Google Fonts** (Cinzel & Merriweather).
- **Material Icons**.

---

## JSON Format (Backup)

The system exports a robust JSON file. Example structure:

```json
{
  "personal_data": {
    "name": "Ivel, the Black",
    "class": "Bard",
    "level": 5
  },
  "theme_color": "#AB6DAC",
  "spells": {
      "cantrips": ["Prestidigitation", "Vicious Mockery"],
      "level_1": ["Cure Wounds"],
      "level_3": ["Fireball"]
  },
  "attributes": {
    "strength": 8,
    "dexterity": 15
  },
  "portrait": "data:image/png;base64..."
}
```

Contribution

Feel free to fork this project and add new features! Ideas for the future:

    [ ] On-screen 3D dice rolling.

    [ ] Simple bestiary.

    [ ] Spell filtering via Open5e API.

Made for the RPG community.
