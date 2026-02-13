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
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;

                // File tab is handled separately by App.setupFileMenu
                if (tabName === 'file') return;

                // Close file menu if open
                document.getElementById('file-menu')?.classList.remove('show');

                document.querySelectorAll('.ribbon-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ribbon-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const panel = document.getElementById(`panel-${tabName}`);
                if (panel) panel.classList.add('active');
                this.activeTab = tabName;
            });
        });
    },

    setupFontDropdown() {
        const fontSelect = document.getElementById('font-family');
        const fontSearch = document.getElementById('font-search');
        const fontList = document.getElementById('font-list');
        const fontDropdown = document.getElementById('font-dropdown');
        if (!fontSelect || !fontList || !fontDropdown) return;

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
            const isOpen = fontDropdown.classList.contains('show');
            fontDropdown.classList.toggle('show');
            if (!isOpen) {
                renderFonts(FontManager.fonts);
                fontSearch?.focus();
            }
        });

        fontSearch?.addEventListener('input', (e) => {
            const results = FontManager.search(e.target.value);
            renderFonts(results);
        });

        fontSearch?.addEventListener('click', (e) => e.stopPropagation());

        document.addEventListener('click', (e) => {
            if (!fontDropdown.contains(e.target) && !fontSelect.contains(e.target)) {
                fontDropdown.classList.remove('show');
            }
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
        document.getElementById('btn-align-left')?.addEventListener('click', () => {
            this.applyToSelected('textAlign', 'left');
            this.updateAlignButtons('left');
        });
        document.getElementById('btn-align-center')?.addEventListener('click', () => {
            this.applyToSelected('textAlign', 'center');
            this.updateAlignButtons('center');
        });
        document.getElementById('btn-align-right')?.addEventListener('click', () => {
            this.applyToSelected('textAlign', 'right');
            this.updateAlignButtons('right');
        });
        document.getElementById('btn-align-justify')?.addEventListener('click', () => {
            this.applyToSelected('textAlign', 'justify');
            this.updateAlignButtons('justify');
        });

        // Lists
        document.getElementById('btn-list-ul')?.addEventListener('click', () => {
            document.execCommand('insertUnorderedList');
        });
        document.getElementById('btn-list-ol')?.addEventListener('click', () => {
            document.execCommand('insertOrderedList');
        });

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
        document.getElementById('btn-insert-shape')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showShapeMenu();
        });
        document.getElementById('btn-insert-watermark')?.addEventListener('click', () => this.showWatermarkDialog());
        document.getElementById('btn-insert-signature')?.addEventListener('click', () => this.showSignatureDialog());
        document.getElementById('btn-insert-pagenum')?.addEventListener('click', () => this.showPageNumberDialog());
        document.getElementById('btn-insert-header')?.addEventListener('click', () => this.insertHeaderFooter('header'));
        document.getElementById('btn-insert-footer')?.addEventListener('click', () => this.insertHeaderFooter('footer'));
        document.getElementById('btn-insert-comment')?.addEventListener('click', () => this.insertElement('comment'));
        document.getElementById('btn-insert-link')?.addEventListener('click', () => this.showLinkDialog());
        document.getElementById('btn-insert-pagebreak')?.addEventListener('click', () => {
            DocModel.addPage(DocModel.activePageIndex);
            Canvas.render();
        });

        // Page operations
        document.getElementById('btn-add-page')?.addEventListener('click', () => {
            DocModel.addPage(DocModel.activePageIndex);
            Canvas.render();
            App.updatePageInfo();
        });
        document.getElementById('btn-delete-page')?.addEventListener('click', () => {
            if (DocModel.pages.length <= 1) {
                document.getElementById('status-text').textContent = 'Cannot delete the only page';
                return;
            }
            DocModel.deletePage(DocModel.activePageIndex);
            Canvas.render();
            App.updatePageInfo();
        });

        document.getElementById('btn-page-move-up')?.addEventListener('click', () => {
            if (DocModel.movePage(DocModel.activePageIndex, -1)) {
                Canvas.render();
                App.updatePageInfo();
            }
        });

        document.getElementById('btn-page-move-down')?.addEventListener('click', () => {
            if (DocModel.movePage(DocModel.activePageIndex, 1)) {
                Canvas.render();
                App.updatePageInfo();
            }
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
        ['brightness', 'contrast', 'saturation', 'hue', 'blur'].forEach(prop => {
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
                const preset = btn.dataset.preset;
                DocModel.setMarginPreset(preset);
                // Update UI inputs
                const m = DocModel.marginPresets[preset];
                if (m) {
                    document.getElementById('marginTop') && (document.getElementById('marginTop').value = m.top);
                    document.getElementById('marginBottom') && (document.getElementById('marginBottom').value = m.bottom);
                    document.getElementById('marginLeft') && (document.getElementById('marginLeft').value = m.left);
                    document.getElementById('marginRight') && (document.getElementById('marginRight').value = m.right);
                }
                Canvas.render();
                document.getElementById('status-text').textContent = `Margins set to ${preset}`;
            });
        });

        // Custom margin inputs
        ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                DocModel.pageSettings[id] = parseInt(e.target.value) || 96;
                DocModel.saveState();
                Canvas.render();
            });
        });

        // Page size
        document.getElementById('page-size')?.addEventListener('change', (e) => {
            DocModel.setPageSize(e.target.value);
            Canvas.render();
            document.getElementById('status-text').textContent = `Page size: ${e.target.value}`;
        });

        // Orientation
        document.getElementById('btn-portrait')?.addEventListener('click', () => {
            DocModel.setOrientation('portrait');
            Canvas.render();
            document.getElementById('status-text').textContent = 'Orientation: Portrait';
        });
        document.getElementById('btn-landscape')?.addEventListener('click', () => {
            DocModel.setOrientation('landscape');
            Canvas.render();
            document.getElementById('status-text').textContent = 'Orientation: Landscape';
        });

        // Column buttons
        document.querySelectorAll('.column-option').forEach(btn => {
            btn.addEventListener('click', () => {
                DocModel.pageSettings.columns = parseInt(btn.dataset.columns) || 1;
                DocModel.saveState();
                Canvas.render();
            });
        });

        // Zoom controls
        const allZoomIn = document.querySelectorAll('#btn-zoom-in');
        const allZoomOut = document.querySelectorAll('#btn-zoom-out');
        allZoomIn.forEach(btn => btn.addEventListener('click', () => Canvas.setZoom(Math.min(3, Canvas.zoom + 0.1))));
        allZoomOut.forEach(btn => btn.addEventListener('click', () => Canvas.setZoom(Math.max(0.25, Canvas.zoom - 0.1))));
        document.getElementById('btn-zoom-fit')?.addEventListener('click', () => Canvas.setZoom(1));

        // View toggles
        document.getElementById('btn-ruler')?.addEventListener('click', function () {
            Canvas.showRuler = !Canvas.showRuler;
            this.classList.toggle('active', Canvas.showRuler);
            Canvas.render();
        });
        document.getElementById('btn-gridlines')?.addEventListener('click', function () {
            Canvas.showGridlines = !Canvas.showGridlines;
            this.classList.toggle('active', Canvas.showGridlines);
            Canvas.render();
        });
        document.getElementById('btn-nav-pane')?.addEventListener('click', function () {
            const panel = document.getElementById('nav-panel');
            if (panel) {
                panel.classList.toggle('show');
                this.classList.toggle('active', panel.classList.contains('show'));
            }
        });

        // Undo/Redo
        document.getElementById('btn-undo')?.addEventListener('click', () => { DocModel.undo(); Canvas.render(); });
        document.getElementById('btn-redo')?.addEventListener('click', () => { DocModel.redo(); Canvas.render(); });

        // File operations
        document.getElementById('btn-new')?.addEventListener('click', () => this.newDocument());
        document.getElementById('btn-open')?.addEventListener('click', () => this.openFile());
        document.getElementById('btn-save')?.addEventListener('click', () => this.saveDocument());
        document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
            document.getElementById('file-menu')?.classList.remove('show');
            ExportManager.exportPDF();
        });
        document.getElementById('btn-export-png')?.addEventListener('click', () => {
            document.getElementById('file-menu')?.classList.remove('show');
            ExportManager.exportPNG();
        });
        document.getElementById('btn-export-docx')?.addEventListener('click', () => {
            document.getElementById('file-menu')?.classList.remove('show');
            ExportManager.exportDOCX();
        });

        // Lock/unlock
        document.getElementById('btn-lock')?.addEventListener('click', () => {
            DocModel.selectedElements.forEach(id => {
                const el = DocModel.getElement(DocModel.activePageIndex, id);
                if (el) {
                    DocModel.updateElement(DocModel.activePageIndex, id, { locked: !el.locked });
                    document.getElementById('status-text').textContent = el.locked ? 'Element unlocked' : 'Element locked';
                }
            });
            Canvas.render();
        });

        // Group/Ungroup
        document.getElementById('btn-group')?.addEventListener('click', () => {
            Canvas.groupSelected();
        });
        document.getElementById('btn-ungroup')?.addEventListener('click', () => {
            Canvas.ungroupSelected();
        });

        // Rotation
        document.getElementById('el-rotation')?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.applyToSelected('rotation', val);
            document.getElementById('el-rotation-val').textContent = val + '°';
        });

        // Element opacity
        document.getElementById('el-opacity')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.applyToSelected('opacity', val / 100);
            document.getElementById('el-opacity-val').textContent = Math.round(val) + '%';
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
            document.getElementById('file-menu')?.classList.remove('show');
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
        const findBtns = document.querySelectorAll('#btn-find');
        findBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('file-menu')?.classList.remove('show');
                this.showFindReplace();
            });
        });

        // Signature tabs
        document.querySelectorAll('.sig-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sig-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const sigContent = document.querySelector('.sig-content');
                if (!sigContent) return;

                const mode = tab.dataset.sig;
                if (mode === 'draw') {
                    sigContent.innerHTML = '<canvas id="sig-canvas" class="sig-canvas"></canvas>';
                    this.initSignaturePad();
                } else if (mode === 'type') {
                    sigContent.innerHTML = `
                        <input type="text" id="sig-type-input" placeholder="Type your signature" 
                            style="width:100%;padding:12px;font-family:'Dancing Script',cursive;font-size:32px;
                            background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);
                            border-radius:6px;text-align:center;">
                    `;
                } else if (mode === 'upload') {
                    sigContent.innerHTML = `
                        <div style="text-align:center;padding:40px;">
                            <button id="sig-upload-btn" class="dialog-btn" style="font-size:14px;">📁 Choose Image</button>
                            <p style="color:var(--text-secondary);margin-top:8px;">Upload a signature image (PNG, JPG)</p>
                        </div>
                    `;
                    document.getElementById('sig-upload-btn')?.addEventListener('click', () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (ev) => {
                            const file = ev.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                sigContent.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:150px;object-fit:contain;">`;
                                sigContent.dataset.uploadedSrc = e.target.result;
                            };
                            reader.readAsDataURL(file);
                        };
                        input.click();
                    });
                }
            });
        });
    },

    updateAlignButtons(active) {
        ['left', 'center', 'right', 'justify'].forEach(a => {
            document.getElementById(`btn-align-${a}`)?.classList.toggle('active', a === active);
        });
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
        if (DocModel.selectedElements.length === 0) return;
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
        document.getElementById('status-text').textContent = `Inserted ${type}`;
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
                    const w = Math.min(img.width, maxW);
                    const el = Elements.createImage(
                        DocModel.pageSettings.marginLeft + 20,
                        DocModel.pageSettings.marginTop + 20,
                        ev.target.result,
                        w, w * ratio
                    );
                    const added = DocModel.addElement(DocModel.activePageIndex, el);
                    DocModel.selectedElements = [added.id];
                    Canvas.render();
                    document.getElementById('status-text').textContent = 'Image inserted';
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
        document.getElementById('status-text').textContent = `Inserted ${type} shape`;
    },

    showWatermarkDialog() {
        const dialog = document.getElementById('watermark-dialog');
        if (dialog) {
            dialog.classList.add('show');
            this.switchWatermarkTab('text'); // Default to text
        }
    },

    switchWatermarkTab(type) {
        document.querySelectorAll('.wm-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.wm-tab-content').forEach(c => c.classList.remove('active'));

        const btnIndex = type === 'text' ? 0 : 1;
        document.querySelectorAll('.wm-tab')[btnIndex].classList.add('active');
        document.getElementById(`wm-tab-${type}`).classList.add('active');
        this._wmType = type;
    },

    handleInsertWatermark() {
        const type = this._wmType || 'text';
        const opacity = document.getElementById('wm-opacity').value / 100;
        const rotation = parseInt(document.getElementById('wm-rotation').value);
        const blur = parseInt(document.getElementById('wm-blur').value);

        const options = { opacity, rotation, blur, subType: type };

        if (type === 'text') {
            const text = document.getElementById('wm-text').value;
            options.fontSize = parseInt(document.getElementById('wm-size').value);
            options.color = document.getElementById('wm-color').value;
            this.insertWatermark(text, options);
        } else {
            const fileInput = document.getElementById('wm-image-upload');
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    options.imageSrc = e.target.result;
                    this.insertWatermark(null, options);
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                alert('Please upload an image.');
            }
        }
    },

    insertWatermark(text, options) {
        const el = Elements.createWatermark(text, options);
        DocModel.addElement(DocModel.activePageIndex, el);
        Canvas.render();
        this.closeAllDialogs();
        document.getElementById('status-text').textContent = 'Watermark inserted';
    },

    showSignatureDialog() {
        const dialog = document.getElementById('signature-dialog');
        if (dialog) {
            dialog.classList.add('show');
            // Reset to draw tab
            document.querySelectorAll('.sig-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.sig-tab[data-sig="draw"]')?.classList.add('active');
            const sigContent = document.querySelector('.sig-content');
            if (sigContent) {
                sigContent.innerHTML = '<canvas id="sig-canvas" class="sig-canvas"></canvas>';
            }
            setTimeout(() => this.initSignaturePad(), 50);
        }
    },

    initSignaturePad() {
        const canvas = document.getElementById('sig-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = canvas.offsetHeight || 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let isDrawing = false;
        canvas.onmousedown = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
        canvas.onmousemove = (e) => { if (isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
        canvas.onmouseup = () => isDrawing = false;
        canvas.onmouseleave = () => isDrawing = false;

        // Touch support
        canvas.ontouchstart = (e) => {
            e.preventDefault(); isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath(); ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        };
        canvas.ontouchmove = (e) => {
            if (isDrawing) {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top); ctx.stroke();
            }
        };
        canvas.ontouchend = () => isDrawing = false;

        document.getElementById('sig-clear')?.addEventListener('click', () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        document.getElementById('sig-insert')?.addEventListener('click', () => {
            const activeTab = document.querySelector('.sig-tab.active')?.dataset.sig;
            const el = Elements.createSignature(
                DocModel.pageSettings.marginLeft + 50,
                DocModel.pageSettings.height - DocModel.pageSettings.marginBottom - 120
            );

            if (activeTab === 'draw') {
                el.dataUrl = canvas.toDataURL();
            } else if (activeTab === 'type') {
                const typeInput = document.getElementById('sig-type-input');
                el.text = typeInput?.value || 'Signature';
                el.signatureType = 'type';
            } else if (activeTab === 'upload') {
                const sigContent = document.querySelector('.sig-content');
                el.dataUrl = sigContent?.dataset.uploadedSrc || '';
                el.signatureType = 'upload';
            }

            const added = DocModel.addElement(DocModel.activePageIndex, el);
            DocModel.selectedElements = [added.id];
            Canvas.render();
            this.closeAllDialogs();
            document.getElementById('status-text').textContent = 'Signature inserted';
        });
    },

    showPageNumberDialog() {
        const dialog = document.getElementById('pagenum-dialog');
        if (dialog) dialog.classList.add('show');

        // Wire up the Apply button properly
        document.getElementById('pagenum-apply')?.addEventListener('click', () => {
            DocModel.pageSettings.pageNumberStyle = document.getElementById('pagenum-style')?.value || 'simple';
            DocModel.pageSettings.pageNumberFormat = document.getElementById('pagenum-format')?.value || 'decimal';
            DocModel.pageSettings.pageNumberPosition = document.getElementById('pagenum-position')?.value || 'bottom-center';
            DocModel.pageSettings.pageNumberStartFrom = parseInt(document.getElementById('pagenum-start')?.value) || 1;
            DocModel.saveState();
            Canvas.render();
            this.closeAllDialogs();
            document.getElementById('status-text').textContent = 'Page numbers applied';
        });
    },

    showLinkDialog() {
        const dialog = document.getElementById('link-dialog');
        if (dialog) dialog.classList.add('show');
    },

    insertHeaderFooter(type) {
        // Insert as a textbox element at appropriate position
        const ps = DocModel.pageSettings;
        const y = type === 'header' ? 20 : ps.height - 40;
        const el = Elements.createTextBox(ps.marginLeft, y, ps.width - ps.marginLeft - ps.marginRight, 30);
        el.content = `<p style="text-align:center;color:#888;font-size:10px;">${type === 'header' ? 'Header text' : 'Footer text'}</p>`;
        el.fontSize = 10;
        el.color = '#888888';
        el.textAlign = 'center';
        el.backgroundColor = 'transparent';
        const added = DocModel.addElement(DocModel.activePageIndex, el);
        DocModel.selectedElements = [added.id];
        Canvas.render();
        document.getElementById('status-text').textContent = `${type === 'header' ? 'Header' : 'Footer'} inserted`;
    },

    closeAllDialogs() {
        document.querySelectorAll('.dialog-overlay').forEach(d => d.classList.remove('show'));
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
        document.getElementById('file-menu')?.classList.remove('show');
    },

    showFindReplace() {
        const panel = document.getElementById('find-replace-panel');
        if (panel) {
            panel.classList.toggle('show');
            if (panel.classList.contains('show')) {
                document.getElementById('find-input')?.focus();
            }
        }
    },

    newDocument() {
        if (confirm('Create a new document? Unsaved changes will be lost.')) {
            DocModel.init();
            DocModel.selectedElements = [];
            Canvas.render();
            App.updatePageInfo();
            document.getElementById('file-menu')?.classList.remove('show');
            document.getElementById('status-text').textContent = 'New document created';
        }
    },

    openFile() {
        document.getElementById('file-menu')?.classList.remove('show');
        const input = document.getElementById('hidden-file-input') || document.createElement('input');
        if (!input.id) {
            input.type = 'file';
            input.accept = '.pdf,.json';
            input.style.display = 'none';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.name.toLowerCase().endsWith('.pdf')) {
                    PDFHandler.openPDF(file);
                } else if (file.name.toLowerCase().endsWith('.json')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        DocModel.deserialize(ev.target.result);
                        Canvas.render();
                        App.updatePageInfo();
                    };
                    reader.readAsText(file);
                }
                input.value = '';
            });
            document.body.appendChild(input);
        }
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
        document.getElementById('file-menu')?.classList.remove('show');
        document.getElementById('status-text').textContent = 'Document saved';
    },

    updateFromSelection() {
        if (DocModel.selectedElements.length === 0) return;

        const el = DocModel.getElement(DocModel.activePageIndex, DocModel.selectedElements[0]);
        if (!el) return;

        // Update toolbar state
        if (el.fontFamily) {
            const fontText = document.getElementById('font-family-text');
            if (fontText) fontText.textContent = el.fontFamily;
        }
        if (el.fontSize) {
            const fontSizeEl = document.getElementById('font-size');
            if (fontSizeEl) fontSizeEl.value = el.fontSize;
        }

        // Toggle button states
        document.getElementById('btn-bold')?.classList.toggle('active', el.fontWeight === 'bold');
        document.getElementById('btn-italic')?.classList.toggle('active', el.fontStyle === 'italic');
        document.getElementById('btn-underline')?.classList.toggle('active', el.textDecoration === 'underline');
        document.getElementById('btn-strikethrough')?.classList.toggle('active', el.textDecoration === 'line-through');

        // Alignment buttons
        if (el.textAlign) this.updateAlignButtons(el.textAlign);

        // Update element properties panel values
        const rotEl = document.getElementById('el-rotation');
        if (rotEl) {
            rotEl.value = el.rotation || 0;
            document.getElementById('el-rotation-val').textContent = (el.rotation || 0) + '°';
        }
        const opEl = document.getElementById('el-opacity');
        if (opEl) {
            opEl.value = (el.opacity || 1) * 100;
            document.getElementById('el-opacity-val').textContent = Math.round((el.opacity || 1) * 100) + '%';
        }

        // Show image-specific controls
        if (el.type === 'image') {
            document.getElementById('img-brightness') && (document.getElementById('img-brightness').value = el.brightness);
            document.getElementById('img-contrast') && (document.getElementById('img-contrast').value = el.contrast);
            document.getElementById('img-saturation') && (document.getElementById('img-saturation').value = el.saturation);
            document.getElementById('img-hue') && (document.getElementById('img-hue').value = el.hue);
            document.getElementById('img-blur') && (document.getElementById('img-blur').value = el.blur || 0);
            document.getElementById('img-cropTop') && (document.getElementById('img-cropTop').value = el.cropTop || 0);
            document.getElementById('img-cropRight') && (document.getElementById('img-cropRight').value = el.cropRight || 0);
            document.getElementById('img-cropBottom') && (document.getElementById('img-cropBottom').value = el.cropBottom || 0);
            document.getElementById('img-cropLeft') && (document.getElementById('img-cropLeft').value = el.cropLeft || 0);
        }

        // Border controls
        document.getElementById('el-border-width') && (document.getElementById('el-border-width').value = el.borderWidth || 0);
        document.getElementById('el-border-color') && (document.getElementById('el-border-color').value = el.borderColor || '#000000');
        document.getElementById('el-border-radius') && (document.getElementById('el-border-radius').value = el.borderRadius || 0);

        // Shape color controls
        if (el.type === 'shape') {
            document.getElementById('shape-fill') && (document.getElementById('shape-fill').value = el.fill || '#4a90d9');
            document.getElementById('shape-stroke') && (document.getElementById('shape-stroke').value = el.stroke || '#2c5f8a');
        }

        // Update status
        document.getElementById('status-text').textContent = `Selected: ${el.type}${el.locked ? ' (locked)' : ''}`;
    }
};

window.Toolbar = Toolbar;
