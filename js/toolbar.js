// toolbar.js — Ribbon toolbar controller & all formatting
const Toolbar = {
    activeTab: 'home',

    init() {
        this.setupTabSwitching();
        this.setupFontDropdown();
        this.setupColorPickers();
        this.setupAllControls();
    },

    setupTabSwitching() {
        document.querySelectorAll('.ribbon-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ribbon-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ribbon-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const panel = document.getElementById(`panel-${tab.dataset.tab}`);
                if (panel) panel.classList.add('active');
                this.activeTab = tab.dataset.tab;
            });
        });
    },

    setupFontDropdown() {
        const fontSelect = document.getElementById('font-family');
        const fontSearch = document.getElementById('font-search');
        const fontList = document.getElementById('font-list');
        if (!fontSelect || !fontList) return;

        const renderFonts = (fonts) => {
            fontList.innerHTML = '';

            if (FontManager.recentFonts.length > 0) {
                const recentHeader = document.createElement('div');
                recentHeader.className = 'font-category-header';
                recentHeader.textContent = 'Recent';
                fontList.appendChild(recentHeader);
                FontManager.recentFonts.forEach(name => {
                    const item = this.createFontItem(name);
                    fontList.appendChild(item);
                });
                const sep = document.createElement('div');
                sep.className = 'font-separator';
                fontList.appendChild(sep);
            }

            const categories = {};
            fonts.forEach(f => {
                if (!categories[f.category]) categories[f.category] = [];
                categories[f.category].push(f);
            });

            Object.keys(categories).forEach(cat => {
                const header = document.createElement('div');
                header.className = 'font-category-header';
                header.textContent = cat;
                fontList.appendChild(header);
                categories[cat].forEach(f => {
                    const item = this.createFontItem(f.name);
                    fontList.appendChild(item);
                });
            });
        };

        fontSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('font-dropdown');
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                renderFonts(FontManager.fonts);
                fontSearch?.focus();
            }
        });

        fontSearch?.addEventListener('input', (e) => {
            const results = FontManager.search(e.target.value);
            renderFonts(results);
        });

        fontSearch?.addEventListener('click', (e) => e.stopPropagation());

        document.addEventListener('click', () => {
            document.getElementById('font-dropdown')?.classList.remove('show');
        });
    },

    createFontItem(fontName) {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.textContent = fontName;
        item.style.fontFamily = `'${fontName}', sans-serif`;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            FontManager.loadFont(fontName).then(() => {
                this.applyToSelected('fontFamily', fontName);
                FontManager.addToRecent(fontName);
                document.getElementById('font-family-text').textContent = fontName;
                document.getElementById('font-dropdown').classList.remove('show');
            });
        });
        // Lazy load font on hover
        item.addEventListener('mouseenter', () => FontManager.loadFont(fontName));
        return item;
    },

    setupColorPickers() {
        const textColor = document.getElementById('text-color');
        const highlight = document.getElementById('highlight-color');
        const shapeColor = document.getElementById('shape-fill');
        const shapeBorder = document.getElementById('shape-stroke');

        textColor?.addEventListener('input', (e) => this.applyToSelected('color', e.target.value));
        highlight?.addEventListener('input', (e) => this.applyToSelected('backgroundColor', e.target.value));
        shapeColor?.addEventListener('input', (e) => this.applyToSelected('fill', e.target.value));
        shapeBorder?.addEventListener('input', (e) => this.applyToSelected('stroke', e.target.value));
    },

    setupAllControls() {
        // Font size
        document.getElementById('font-size')?.addEventListener('change', (e) => {
            this.applyToSelected('fontSize', parseInt(e.target.value));
        });

        // Bold / Italic / Underline / Strikethrough
        document.getElementById('btn-bold')?.addEventListener('click', () => this.toggleStyle('fontWeight', 'bold', 'normal'));
        document.getElementById('btn-italic')?.addEventListener('click', () => this.toggleStyle('fontStyle', 'italic', 'normal'));
        document.getElementById('btn-underline')?.addEventListener('click', () => this.toggleStyle('textDecoration', 'underline', 'none'));
        document.getElementById('btn-strikethrough')?.addEventListener('click', () => this.toggleStyle('textDecoration', 'line-through', 'none'));

        // Superscript / Subscript
        document.getElementById('btn-superscript')?.addEventListener('click', () => {
            document.execCommand('superscript');
        });
        document.getElementById('btn-subscript')?.addEventListener('click', () => {
            document.execCommand('subscript');
        });

        // Alignment
        document.getElementById('btn-align-left')?.addEventListener('click', () => this.applyToSelected('textAlign', 'left'));
        document.getElementById('btn-align-center')?.addEventListener('click', () => this.applyToSelected('textAlign', 'center'));
        document.getElementById('btn-align-right')?.addEventListener('click', () => this.applyToSelected('textAlign', 'right'));
        document.getElementById('btn-align-justify')?.addEventListener('click', () => this.applyToSelected('textAlign', 'justify'));

        // Line Spacing
        document.getElementById('line-spacing')?.addEventListener('change', (e) => {
            this.applyToSelected('lineHeight', parseFloat(e.target.value));
        });

        // Letter Spacing
        document.getElementById('letter-spacing')?.addEventListener('input', (e) => {
            this.applyToSelected('letterSpacing', parseFloat(e.target.value));
        });

        // Word Spacing
        document.getElementById('word-spacing')?.addEventListener('input', (e) => {
            this.applyToSelected('wordSpacing', parseFloat(e.target.value));
        });

        // Styles quick apply
        document.querySelectorAll('.style-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const style = btn.dataset.style;
                this.applyStylePreset(style);
            });
        });

        // Insert buttons
        document.getElementById('btn-insert-textbox')?.addEventListener('click', () => this.insertElement('textbox'));
        document.getElementById('btn-insert-image')?.addEventListener('click', () => this.insertImage());
        document.getElementById('btn-insert-table')?.addEventListener('click', () => this.showTableDialog());
        document.getElementById('btn-insert-shape')?.addEventListener('click', () => this.showShapeMenu());
        document.getElementById('btn-insert-watermark')?.addEventListener('click', () => this.showWatermarkDialog());
        document.getElementById('btn-insert-signature')?.addEventListener('click', () => this.showSignatureDialog());
        document.getElementById('btn-insert-pagenum')?.addEventListener('click', () => this.showPageNumberDialog());
        document.getElementById('btn-insert-header')?.addEventListener('click', () => this.insertHeaderFooter('header'));
        document.getElementById('btn-insert-footer')?.addEventListener('click', () => this.insertHeaderFooter('footer'));
        document.getElementById('btn-insert-comment')?.addEventListener('click', () => this.insertElement('comment'));
        document.getElementById('btn-insert-link')?.addEventListener('click', () => this.showLinkDialog());
        document.getElementById('btn-insert-pagebreak')?.addEventListener('click', () => DocModel.addPage(DocModel.activePageIndex));

        // Page operations
        document.getElementById('btn-add-page')?.addEventListener('click', () => {
            DocModel.addPage(DocModel.activePageIndex);
            Canvas.render();
        });
        document.getElementById('btn-delete-page')?.addEventListener('click', () => {
            DocModel.deletePage(DocModel.activePageIndex);
            Canvas.render();
        });

        // Element z-order
        document.getElementById('btn-bring-front')?.addEventListener('click', () => {
            DocModel.selectedElements.forEach(id => DocModel.bringToFront(DocModel.activePageIndex, id));
            Canvas.render();
        });
        document.getElementById('btn-send-back')?.addEventListener('click', () => {
            DocModel.selectedElements.forEach(id => DocModel.sendToBack(DocModel.activePageIndex, id));
            Canvas.render();
        });

        // Image color correction sliders
        ['brightness', 'contrast', 'saturation', 'hue', 'blur', 'opacity'].forEach(prop => {
            document.getElementById(`img-${prop}`)?.addEventListener('input', (e) => {
                this.applyToSelected(prop, parseFloat(e.target.value));
            });
        });

        // Image crop
        ['cropTop', 'cropRight', 'cropBottom', 'cropLeft'].forEach(prop => {
            document.getElementById(`img-${prop}`)?.addEventListener('input', (e) => {
                this.applyToSelected(prop, parseFloat(e.target.value));
            });
        });

        // Margin presets
        document.querySelectorAll('.margin-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                DocModel.setMarginPreset(btn.dataset.preset);
                Canvas.render();
            });
        });

        // Page size
        document.getElementById('page-size')?.addEventListener('change', (e) => {
            DocModel.setPageSize(e.target.value);
            Canvas.render();
        });

        // Orientation
        document.getElementById('btn-portrait')?.addEventListener('click', () => {
            DocModel.setOrientation('portrait');
            Canvas.render();
        });
        document.getElementById('btn-landscape')?.addEventListener('click', () => {
            DocModel.setOrientation('landscape');
            Canvas.render();
        });

        // Zoom controls
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => Canvas.setZoom(Canvas.zoom + 0.1));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => Canvas.setZoom(Canvas.zoom - 0.1));
        document.getElementById('btn-zoom-fit')?.addEventListener('click', () => Canvas.setZoom(1));

        // View toggles
        document.getElementById('btn-ruler')?.addEventListener('click', () => {
            Canvas.showRuler = !Canvas.showRuler;
            document.getElementById('ruler-container')?.classList.toggle('hidden', !Canvas.showRuler);
        });
        document.getElementById('btn-gridlines')?.addEventListener('click', () => {
            Canvas.showGridlines = !Canvas.showGridlines;
            Canvas.render();
        });
        document.getElementById('btn-nav-pane')?.addEventListener('click', () => {
            document.getElementById('nav-panel')?.classList.toggle('show');
        });

        // Undo/Redo
        document.getElementById('btn-undo')?.addEventListener('click', () => { DocModel.undo(); Canvas.render(); });
        document.getElementById('btn-redo')?.addEventListener('click', () => { DocModel.redo(); Canvas.render(); });

        // File operations
        document.getElementById('btn-new')?.addEventListener('click', () => this.newDocument());
        document.getElementById('btn-open')?.addEventListener('click', () => this.openFile());
        document.getElementById('btn-save')?.addEventListener('click', () => this.saveDocument());
        document.getElementById('btn-export-pdf')?.addEventListener('click', () => ExportManager.exportPDF());
        document.getElementById('btn-export-png')?.addEventListener('click', () => ExportManager.exportPNG());
        document.getElementById('btn-export-docx')?.addEventListener('click', () => ExportManager.exportDOCX());

        // Lock/unlock
        document.getElementById('btn-lock')?.addEventListener('click', () => {
            DocModel.selectedElements.forEach(id => {
                const el = DocModel.getElement(DocModel.activePageIndex, id);
                if (el) DocModel.updateElement(DocModel.activePageIndex, id, { locked: !el.locked });
            });
            Canvas.render();
        });

        // Rotation
        document.getElementById('el-rotation')?.addEventListener('input', (e) => {
            this.applyToSelected('rotation', parseInt(e.target.value));
        });

        // Element opacity
        document.getElementById('el-opacity')?.addEventListener('input', (e) => {
            this.applyToSelected('opacity', parseFloat(e.target.value) / 100);
        });

        // Border controls
        document.getElementById('el-border-width')?.addEventListener('input', (e) => {
            this.applyToSelected('borderWidth', parseInt(e.target.value));
        });
        document.getElementById('el-border-color')?.addEventListener('input', (e) => {
            this.applyToSelected('borderColor', e.target.value);
        });
        document.getElementById('el-border-radius')?.addEventListener('input', (e) => {
            this.applyToSelected('borderRadius', parseInt(e.target.value));
        });

        // OCR button
        document.getElementById('btn-ocr')?.addEventListener('click', () => {
            if (typeof OCRManager !== 'undefined') OCRManager.runOCR();
        });

        // View modes
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof ViewManager !== 'undefined') ViewManager.setMode(btn.dataset.mode);
            });
        });

        // Dark mode
        document.getElementById('btn-dark-mode')?.addEventListener('click', () => {
            if (typeof ViewManager !== 'undefined') ViewManager.toggleDarkMode();
        });

        // Find/Replace
        document.getElementById('btn-find')?.addEventListener('click', () => this.showFindReplace());
    },

    toggleStyle(prop, val1, val2) {
        DocModel.selectedElements.forEach(id => {
            const el = DocModel.getElement(DocModel.activePageIndex, id);
            if (el) {
                const current = el[prop];
                DocModel.updateElement(DocModel.activePageIndex, id, { [prop]: current === val1 ? val2 : val1 });
            }
        });
        Canvas.render();
    },

    applyToSelected(prop, value) {
        DocModel.selectedElements.forEach(id => {
            DocModel.updateElement(DocModel.activePageIndex, id, { [prop]: value });
        });
        Canvas.render();
    },

    applyStylePreset(style) {
        const presets = {
            'normal': { fontFamily: 'Inter', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', lineHeight: 1.5 },
            'no-spacing': { fontFamily: 'Inter', fontSize: 14, fontWeight: 'normal', lineHeight: 1.0 },
            'heading1': { fontFamily: 'Inter', fontSize: 28, fontWeight: 'bold', color: '#1a365d', lineHeight: 1.3 },
            'heading2': { fontFamily: 'Inter', fontSize: 22, fontWeight: 'bold', color: '#2d4a7a', lineHeight: 1.3 },
            'heading3': { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', color: '#3a6ea5', lineHeight: 1.3 },
            'title': { fontFamily: 'Playfair Display', fontSize: 36, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 },
            'subtitle': { fontFamily: 'Inter', fontSize: 16, fontWeight: '300', color: '#666', textAlign: 'center', lineHeight: 1.4 },
            'quote': { fontFamily: 'Lora', fontSize: 16, fontStyle: 'italic', color: '#555', lineHeight: 1.6, padding: 20 }
        };
        const preset = presets[style];
        if (preset) {
            FontManager.loadFont(preset.fontFamily);
            this.applyToSelected('__batch', null);
            DocModel.selectedElements.forEach(id => DocModel.updateElement(DocModel.activePageIndex, id, preset));
            Canvas.render();
        }
    },

    insertElement(type) {
        const ps = DocModel.pageSettings;
        const cx = ps.marginLeft + 50;
        const cy = ps.marginTop + 50;
        let el;
        switch (type) {
            case 'textbox': el = Elements.createTextBox(cx, cy); break;
            case 'comment': el = Elements.createComment(ps.width - 250, cy); break;
            default: return;
        }
        const added = DocModel.addElement(DocModel.activePageIndex, el);
        DocModel.selectedElements = [added.id];
        Canvas.render();
    },

    insertImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const maxW = 400;
                    const ratio = img.height / img.width;
                    const el = Elements.createImage(
                        DocModel.pageSettings.marginLeft + 20,
                        DocModel.pageSettings.marginTop + 20,
                        ev.target.result,
                        Math.min(img.width, maxW),
                        Math.min(img.width, maxW) * ratio
                    );
                    const added = DocModel.addElement(DocModel.activePageIndex, el);
                    DocModel.selectedElements = [added.id];
                    Canvas.render();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    showTableDialog() {
        const dialog = document.getElementById('table-dialog');
        if (dialog) {
            dialog.classList.add('show');
            const grid = document.getElementById('table-grid-selector');
            if (grid) this.setupTableGrid(grid);
        }
    },

    setupTableGrid(grid) {
        grid.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r + 1;
                cell.dataset.col = c + 1;
                cell.addEventListener('mouseenter', () => {
                    grid.querySelectorAll('.grid-cell').forEach(gc => {
                        const gr = parseInt(gc.dataset.row);
                        const gCol = parseInt(gc.dataset.col);
                        gc.classList.toggle('highlight', gr <= r + 1 && gCol <= c + 1);
                    });
                    document.getElementById('table-size-label').textContent = `${r + 1} × ${c + 1} Table`;
                });
                cell.addEventListener('click', () => {
                    const el = Elements.createTable(
                        DocModel.pageSettings.marginLeft + 20,
                        DocModel.pageSettings.marginTop + 20,
                        r + 1, c + 1
                    );
                    const added = DocModel.addElement(DocModel.activePageIndex, el);
                    DocModel.selectedElements = [added.id];
                    Canvas.render();
                    this.closeAllDialogs();
                });
                grid.appendChild(cell);
            }
        }
    },

    showShapeMenu() {
        const menu = document.getElementById('shape-menu');
        if (menu) menu.classList.toggle('show');
    },

    insertShape(type) {
        const el = Elements.createShape(
            DocModel.pageSettings.marginLeft + 50,
            DocModel.pageSettings.marginTop + 50,
            type
        );
        const added = DocModel.addElement(DocModel.activePageIndex, el);
        DocModel.selectedElements = [added.id];
        Canvas.render();
        this.closeAllDialogs();
    },

    showWatermarkDialog() {
        const dialog = document.getElementById('watermark-dialog');
        if (dialog) dialog.classList.add('show');
    },

    insertWatermark(text, options) {
        const el = Elements.createWatermark(text, options);
        DocModel.addElement(DocModel.activePageIndex, el);
        Canvas.render();
        this.closeAllDialogs();
    },

    showSignatureDialog() {
        const dialog = document.getElementById('signature-dialog');
        if (dialog) {
            dialog.classList.add('show');
            this.initSignaturePad();
        }
    },

    initSignaturePad() {
        const canvas = document.getElementById('sig-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        let isDrawing = false;
        canvas.onmousedown = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
        canvas.onmousemove = (e) => { if (isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
        canvas.onmouseup = () => isDrawing = false;
        canvas.onmouseleave = () => isDrawing = false;

        document.getElementById('sig-clear')?.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        document.getElementById('sig-insert')?.addEventListener('click', () => {
            const dataUrl = canvas.toDataURL();
            const el = Elements.createSignature(
                DocModel.pageSettings.marginLeft + 50,
                DocModel.pageSettings.height - DocModel.pageSettings.marginBottom - 120
            );
            el.dataUrl = dataUrl;
            const added = DocModel.addElement(DocModel.activePageIndex, el);
            DocModel.selectedElements = [added.id];
            Canvas.render();
            this.closeAllDialogs();
        });
    },

    showPageNumberDialog() {
        const dialog = document.getElementById('pagenum-dialog');
        if (dialog) dialog.classList.add('show');
    },

    showLinkDialog() {
        const dialog = document.getElementById('link-dialog');
        if (dialog) dialog.classList.add('show');
    },

    insertHeaderFooter(type) {
        const hf = Elements.createHeaderFooter(type);
        DocModel.pageSettings[type + 'Content'] = hf;
        Canvas.render();
    },

    closeAllDialogs() {
        document.querySelectorAll('.dialog-overlay').forEach(d => d.classList.remove('show'));
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
    },

    showFindReplace() {
        const panel = document.getElementById('find-replace-panel');
        if (panel) {
            panel.classList.toggle('show');
            document.getElementById('find-input')?.focus();
        }
    },

    newDocument() {
        if (confirm('Create a new document? Unsaved changes will be lost.')) {
            DocModel.init();
            Canvas.render();
        }
    },

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.name.endsWith('.pdf')) {
                PDFHandler.openPDF(file);
            } else if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    DocModel.deserialize(ev.target.result);
                    Canvas.render();
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },

    saveDocument() {
        const data = DocModel.serialize();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    updateFromSelection() {
        if (DocModel.selectedElements.length === 0) {
            document.getElementById('properties-panel')?.classList.remove('show');
            return;
        }

        const el = DocModel.getElement(DocModel.activePageIndex, DocModel.selectedElements[0]);
        if (!el) return;

        // Update toolbar state
        if (el.fontFamily) document.getElementById('font-family-text') && (document.getElementById('font-family-text').textContent = el.fontFamily);
        if (el.fontSize) document.getElementById('font-size') && (document.getElementById('font-size').value = el.fontSize);

        // Toggle button states
        document.getElementById('btn-bold')?.classList.toggle('active', el.fontWeight === 'bold');
        document.getElementById('btn-italic')?.classList.toggle('active', el.fontStyle === 'italic');
        document.getElementById('btn-underline')?.classList.toggle('active', el.textDecoration === 'underline');

        // Show/hide context-sensitive panels
        const imgPanel = document.getElementById('image-corrections');
        const textFormatting = document.getElementById('text-formatting');
        if (el.type === 'image') {
            imgPanel?.classList.add('show');
            textFormatting?.classList.remove('show');
            // Update slider values
            document.getElementById('img-brightness') && (document.getElementById('img-brightness').value = el.brightness);
            document.getElementById('img-contrast') && (document.getElementById('img-contrast').value = el.contrast);
            document.getElementById('img-saturation') && (document.getElementById('img-saturation').value = el.saturation);
            document.getElementById('img-hue') && (document.getElementById('img-hue').value = el.hue);
        } else {
            imgPanel?.classList.remove('show');
            if (el.type === 'textbox') textFormatting?.classList.add('show');
        }

        // Update element properties panel
        document.getElementById('el-rotation') && (document.getElementById('el-rotation').value = el.rotation || 0);
        document.getElementById('el-opacity') && (document.getElementById('el-opacity').value = (el.opacity || 1) * 100);
    }
};

window.Toolbar = Toolbar;
