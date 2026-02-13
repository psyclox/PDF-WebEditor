# 📄 ProEditor — Professional Document & PDF Editor

<div align="center">

![ProEditor](https://img.shields.io/badge/ProEditor-v1.0.0-0078d4?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PDF.js](https://img.shields.io/badge/PDF.js-FF6600?style=for-the-badge)
![Tesseract](https://img.shields.io/badge/Tesseract_OCR-4285F4?style=for-the-badge)

**A powerful, full-featured web-based document and PDF editor inspired by Adobe Acrobat Pro & Microsoft Word.**

[Features](#-features) · [Quick Start](#-quick-start) · [Keyboard Shortcuts](#-keyboard-shortcuts) · [Tech Stack](#-tech-stack) · [Contributing](#-contributing)

</div>

---

## ✨ Features

### 📝 Rich Text Editing
- **200+ Professional Fonts** — Google Fonts integration with Serif, Sans-Serif, Monospace, Display & Handwriting categories
- **Full Typography Controls** — Font family, size (8–72pt), bold, italic, underline, strikethrough, superscript, subscript
- **Text & Highlight Colors** — Full color picker for text and background highlight
- **Paragraph Formatting** — Left, center, right, justify alignment
- **Advanced Spacing** — Line height (1.0–3.0), letter spacing, word spacing
- **Quick Styles** — Normal, No Spacing, Heading 1–3, Title, Subtitle, Quote presets

### 🖼️ Element Manipulation
- **Text Boxes** — Rich-text editable, resizable, draggable
- **Images** — Upload, crop (top/right/bottom/left), color correction (brightness, contrast, saturation, hue, blur)
- **Shapes** — Rectangle, Circle, Triangle, Line, Arrow, Star with customizable fill & stroke
- **Tables** — Interactive grid selector (up to 8×8), editable cells, headers, borders
- **Watermarks** — Text watermarks with custom font, size, color, opacity, rotation
- **Signatures** — Draw pad, type, or upload signature
- **Comments** — Sticky-note style annotations
- **Links** — Clickable hyperlinks

### 📐 Page Layout
- **Margin Presets** — Normal, Narrow, Moderate, Wide, Mirrored + Custom px values
- **Page Sizes** — Letter, A4, A3, Legal, A5, B5, Executive, Tabloid
- **Orientation** — Portrait & Landscape
- **Page Numbers** — 5 formats (1, i, I, a, A), 6 positions, custom start number
- **Headers & Footers** — Custom content and formatting
- **Multi-column Layout** — 1, 2, or 3 columns

### 👁️ View Modes
- **Print Layout** — Standard page view
- **Read Mode** — Distraction-free reading
- **Web Layout** — Full-width continuous flow
- **Outline** — Document structure view
- **Focus Mode** — Hides all UI except the document
- **Immersive Reader** — Dark background reading experience
- **Zoom** — 25% to 300% (Ctrl+Scroll)
- **Ruler & Gridlines** — Toggle alignment aids
- **Navigation Pane** — Page thumbnails sidebar
- **Page Movement** — Vertical scroll or Side-by-Side

### 🔍 OCR (Optical Character Recognition)
- **Tesseract.js** powered text extraction from images
- **Progress tracking** with visual progress bar
- Converts recognized text into editable text boxes

### 💾 Export Options
| Format | Library | Description |
|--------|---------|-------------|
| **PDF** | pdf-lib | Full document reconstruction with text, images, shapes, watermarks |
| **PNG** | html2canvas | High-resolution page-by-page image export |
| **DOCX** | docx | Microsoft Word–compatible document with headings, tables, images |

### 🛠️ Advanced Features
- **Undo/Redo** — 50-step history (Ctrl+Z / Ctrl+Y)
- **Find & Replace** — Search and replace text across the document
- **Context Menu** — Right-click for quick actions
- **Keyboard Shortcuts** — Full shortcut support
- **Element Z-ordering** — Bring to Front / Send to Back
- **Element Locking** — Prevent accidental edits
- **Snap-to-Grid** — Precise element positioning
- **Arrow Key Nudge** — Fine-tune positions (1px or 10px with Shift)
- **Multi-select** — Ctrl+Click for multiple elements
- **Clipboard** — Cut, Copy, Paste, Duplicate (Ctrl+D)
- **Auto-save** — Document state preservation

---

## 🚀 Quick Start

### Option 1: Direct Open
Simply open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Server
```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000
```
Then navigate to `http://localhost:8000`

### Option 3: VS Code Live Server
Install the "Live Server" extension and click "Go Live" in the status bar.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + C` | Copy |
| `Ctrl + V` | Paste |
| `Ctrl + D` | Duplicate |
| `Ctrl + A` | Select All |
| `Delete` / `Backspace` | Delete selected |
| `Arrow Keys` | Nudge 1px |
| `Shift + Arrow` | Nudge 10px |
| `Ctrl + Scroll` | Zoom In/Out |
| `Escape` | Close dialogs / Exit focus |

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| PDF Rendering | [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla) |
| PDF Creation | [pdf-lib](https://pdf-lib.js.org/) |
| OCR Engine | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| DOCX Export | [docx](https://docx.js.org/) |
| Screenshot | [html2canvas](https://html2canvas.hertzen.com/) |
| Fonts | [Google Fonts](https://fonts.google.com/) (200+ families) |
| Build Step | None — Zero dependencies, CDN-powered |

---

## 📁 Project Structure

```
proeditor/
├── index.html              # Main application shell with ribbon UI
├── styles.css              # Complete dark-theme styling
├── README.md               # This file
└── js/
    ├── app.js              # Main controller & initialization
    ├── fonts.js            # 200+ font definitions & loader
    ├── document.js         # Document model, pages, history
    ├── elements.js         # Element factories (text, image, table, etc.)
    ├── canvas.js           # Page rendering & interaction engine
    ├── toolbar.js          # Ribbon toolbar controller
    ├── views.js            # View modes (Read, Print, Focus, etc.)
    ├── pdf-handler.js      # PDF import via PDF.js
    ├── ocr.js              # OCR via Tesseract.js
    ├── export.js           # PDF, PNG, DOCX export
    └── page-settings.js    # Margins, page size, orientation
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<br>
<strong>Built with ❤️ for the open-source community</strong>
<br><br>
<sub>ProEditor — Because editing documents should be free, powerful, and beautiful.</sub>
</div>
