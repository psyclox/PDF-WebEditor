// canvas.js — Page rendering engine, drag/drop, rubber-band select, grouping
const Canvas = {
    container: null,
    pagesContainer: null,
    zoom: 1,

    // Drag state
    isDragging: false,
    isResizing: false,
    isSelecting: false,   // Rubber-band selection mode
    resizeHandle: '',
    dragStartX: 0,
    dragStartY: 0,
    dragElStartX: 0,
    dragElStartY: 0,
    dragElStartW: 0,
    dragElStartH: 0,
    activeElement: null,
    activePageIndex: 0,

    // Selection rect
    selectRect: null,
    selectPageIndex: -1,

    // View toggles
    showRuler: false,
    showGridlines: false,
    snapToGrid: true,
    gridSize: 10,

    // Editing state — when a textbox is focused for editing, don't allow drag
    editingTextbox: null,

    init() {
        this.container = document.getElementById('document-area');
        this.pagesContainer = document.getElementById('pages-container');
        this.setupEvents();
        this.setupFileDrop();
        this.render();
    },

    // ======== RENDER ========

    render() {
        if (!this.pagesContainer) return;
        this.pagesContainer.innerHTML = '';
        const ps = DocModel.pageSettings;

        DocModel.pages.forEach((page, pageIdx) => {
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'page-wrapper';

            const pageEl = document.createElement('div');
            pageEl.className = 'page' + (pageIdx === DocModel.activePageIndex ? ' active' : '');
            pageEl.dataset.pageIndex = pageIdx;
            pageEl.style.width = ps.width + 'px';
            pageEl.style.height = ps.height + 'px';
            pageEl.style.backgroundColor = page.backgroundColor || ps.backgroundColor || '#fff';
            pageEl.style.transform = `scale(${this.zoom})`;
            pageEl.style.transformOrigin = 'top center';
            pageEl.style.position = 'relative';
            pageEl.style.overflow = 'hidden';

            // Ruler
            if (this.showRuler) {
                const ruler = document.createElement('div');
                ruler.className = 'ruler-overlay';
                ruler.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:20px;background:rgba(255,255,255,0.9);border-bottom:1px solid #ccc;z-index:1000;font-size:8px;color:#666;pointer-events:none;';
                for (let i = 0; i <= ps.width; i += 100) {
                    const mark = document.createElement('span');
                    mark.style.cssText = `position:absolute;left:${i}px;bottom:0;border-left:1px solid #999;height:12px;font-size:7px;padding-left:2px;`;
                    mark.textContent = (i / 96).toFixed(1) + '"';
                    ruler.appendChild(mark);
                }
                pageEl.appendChild(ruler);
            }

            // Gridlines / Column Guides
            if (this.showGridlines || (ps.columns && ps.columns > 1)) {
                const guides = document.createElement('div');
                guides.style.cssText = `position:absolute;top:${ps.marginTop}px;left:${ps.marginLeft}px;right:${ps.marginRight}px;bottom:${ps.marginBottom}px;pointer-events:none;z-index:999;`;

                // Border for margins
                if (this.showGridlines) {
                    guides.style.border = '1px dashed rgba(0,120,215,0.3)';
                }

                // Columns
                if (ps.columns && ps.columns > 1) {
                    const contentWidth = ps.width - ps.marginLeft - ps.marginRight;
                    const colWidth = (contentWidth - (ps.columns - 1) * 24) / ps.columns; // 24px gap

                    for (let c = 1; c < ps.columns; c++) {
                        const gapCenter = (colWidth * c) + (24 * (c - 1)) + 12;
                        const line = document.createElement('div');
                        line.style.cssText = `position:absolute;left:${gapCenter}px;top:0;bottom:0;width:0;border-left:1px dashed rgba(0,0,0,0.1);`;
                        guides.appendChild(line);
                    }
                }

                pageEl.appendChild(guides);
            }

            // Render elements sorted by z-index
            const sorted = [...page.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            sorted.forEach(el => {
                if (el.visible === false) return;
                const dom = this.renderElement(el, pageIdx);
                if (dom) pageEl.appendChild(dom);
            });

            // Page number
            if (ps.pageNumberStyle && ps.pageNumberStyle !== 'none') {
                const pn = this.renderPageNumber(pageIdx);
                if (pn) pageEl.appendChild(pn);
            }

            pageWrapper.appendChild(pageEl);

            // Page label
            const label = document.createElement('div');
            label.className = 'page-label';
            label.textContent = `Page ${pageIdx + 1} of ${DocModel.pages.length}`;
            pageWrapper.appendChild(label);

            this.pagesContainer.appendChild(pageWrapper);
        });

        this.updateThumbnails();
        if (typeof App !== 'undefined' && App.updatePageInfo) App.updatePageInfo();
    },

    // ======== ELEMENT RENDERING ========

    renderElement(el, pageIdx) {
        const wrapper = document.createElement('div');
        wrapper.className = 'element-wrapper';
        wrapper.dataset.elementId = el.id;
        wrapper.dataset.pageIndex = pageIdx;
        wrapper.dataset.type = el.type;

        const isSelected = DocModel.selectedElements.includes(el.id);
        if (isSelected) wrapper.classList.add('selected');
        if (el.locked) wrapper.classList.add('locked');
        if (el.groupId) wrapper.dataset.groupId = el.groupId;

        wrapper.style.cssText = `
            position:absolute;left:${el.x}px;top:${el.y}px;
            width:${el.width}px;height:${el.height}px;
            opacity:${el.opacity !== undefined ? el.opacity : 1};
            z-index:${(el.zIndex || 0) + 10};
            transform:rotate(${el.rotation || 0}deg);
            cursor:${el.locked ? 'default' : 'move'};
        `;

        // Double-click to edit textboxes
        wrapper.addEventListener('dblclick', (e) => {
            if (el.locked) return;
            if (el.type === 'textbox' || el.type === 'comment') {
                this.enterEditMode(el.id);
                e.stopPropagation();
            }
        });


        let content;
        switch (el.type) {
            case 'textbox': content = this.renderTextBox(el, wrapper); break;
            case 'image': content = this.renderImage(el); break;
            case 'shape': content = this.renderShape(el); break;
            case 'table': content = this.renderTable(el); break;
            case 'watermark': content = this.renderWatermark(el); break;
            case 'signature': content = this.renderSignature(el); break;
            case 'comment': content = this.renderComment(el); break;
            case 'link': content = this.renderLink(el); break;
            default: return null;
        }

        if (content) wrapper.appendChild(content);

        // Resize handles when selected and unlocked
        if (isSelected && !el.locked) {
            ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(dir => {
                const handle = document.createElement('div');
                handle.className = `resize-handle resize-${dir}`;
                handle.dataset.handle = dir;
                wrapper.appendChild(handle);
            });
        }

        return wrapper;
    },

    renderTextBox(el, wrapper) {
        const div = document.createElement('div');
        div.className = 'element-textbox';
        div.innerHTML = el.content;
        div.style.cssText = `
            width:100%;height:100%;
            font-family:'${el.fontFamily || 'Inter'}',sans-serif;
            font-size:${el.fontSize || 14}px;font-weight:${el.fontWeight || 'normal'};
            font-style:${el.fontStyle || 'normal'};text-decoration:${el.textDecoration || 'none'};
            text-align:${el.textAlign || 'left'};color:${el.color || '#000'};
            line-height:${el.lineHeight || 1.5};letter-spacing:${el.letterSpacing || 0}px;
            word-spacing:${el.wordSpacing || 0}px;
            column-count:${el.columnCount || 'auto'};column-gap:24px;
            background:${el.backgroundColor || 'transparent'};padding:${el.padding || 8}px;
            border:${el.borderWidth || 0}px solid ${el.borderColor || 'transparent'};
            outline:none;overflow:hidden;box-sizing:border-box;
            border-radius:${el.borderRadius || 0}px;
            cursor:move;user-select:none;pointer-events:none;
        `;

        // If unlocked, allow pointer events so the element itself (opaque bg) captures the click
        if (!el.locked) {
            div.style.pointerEvents = 'auto';
        } else {
            div.style.pointerEvents = 'auto';
        }

        // Default: NOT editable — double-click to edit
        div.contentEditable = false;

        // Double-click to enter edit mode is handled on the WRAPPER in onMouseDown/Doubleclick logic?
        // Wait, wrapper captures double click? No, we need to listen on wrapper.

        // Actually, let's keep it simple:
        // Textbox DIV has pointer-events: none so clicks hit the wrapper.
        // BUT we need to detect double-click. wrapper handles it.

        return div;
    },

    // Helper to switch to edit mode
    enterEditMode(elId) {
        const wrapper = document.querySelector(`.element-wrapper[data-element-id="${elId}"]`);
        if (!wrapper) return;
        const div = wrapper.querySelector('.element-textbox');
        if (!div) return;

        div.contentEditable = true;
        div.style.pointerEvents = 'auto';
        div.style.userSelect = 'text';
        div.style.cursor = 'text';
        div.focus();
        this.editingTextbox = elId;
        wrapper.style.cursor = 'text';
        wrapper.draggable = false;

        // On blur, exit edit mode
        const onBlur = () => {
            div.contentEditable = false;
            div.style.pointerEvents = 'none';
            div.style.userSelect = 'none';
            div.style.cursor = 'move';
            DocModel.updateElement(null, elId, { content: div.innerHTML });
            this.editingTextbox = null;
            wrapper.style.cursor = 'move';
            div.removeEventListener('blur', onBlur);
        };
        div.addEventListener('blur', onBlur);
    },

    renderImage(el) {
        const container = document.createElement('div');
        container.className = 'element-image-container';
        container.style.cssText = `width:100%;height:100%;overflow:hidden;border-radius:${el.borderRadius || 0}px;border:${el.borderWidth || 0}px solid ${el.borderColor || 'transparent'};`;

        const img = document.createElement('img');
        img.src = el.src;
        img.style.cssText = `
            width:100%;height:100%;object-fit:${el.objectFit || 'contain'};
            filter:brightness(${el.brightness || 100}%) contrast(${el.contrast || 100}%) saturate(${el.saturation || 100}%) hue-rotate(${el.hue || 0}deg) blur(${el.blur || 0}px);
            clip-path:inset(${el.cropTop || 0}% ${el.cropRight || 0}% ${el.cropBottom || 0}% ${el.cropLeft || 0}%);
            pointer-events:none;
        `;
        img.draggable = false;
        img.onerror = () => {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f0f0f0;color:#999;font-size:12px;">⚠️ Image</div>';
        };
        container.appendChild(img);
        return container;
    },

    renderShape(el) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${el.width} ${el.height}`);
        svg.style.overflow = 'visible';

        let shape;
        const sw = el.strokeWidth || 2;
        switch (el.shapeType) {
            case 'rectangle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('x', sw); shape.setAttribute('y', sw);
                shape.setAttribute('width', Math.max(el.width - sw * 2, 1)); shape.setAttribute('height', Math.max(el.height - sw * 2, 1));
                shape.setAttribute('rx', el.borderRadius || 0);
                break;
            case 'circle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                shape.setAttribute('cx', el.width / 2); shape.setAttribute('cy', el.height / 2);
                shape.setAttribute('rx', Math.max(el.width / 2 - sw, 1)); shape.setAttribute('ry', Math.max(el.height / 2 - sw, 1));
                break;
            case 'triangle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shape.setAttribute('points', `${el.width / 2},${sw} ${el.width - sw},${el.height - sw} ${sw},${el.height - sw}`);
                break;
            case 'line':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                shape.setAttribute('x1', 0); shape.setAttribute('y1', el.height / 2);
                shape.setAttribute('x2', el.width); shape.setAttribute('y2', el.height / 2);
                break;
            case 'arrow':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ln.setAttribute('x1', 0); ln.setAttribute('y1', el.height / 2);
                ln.setAttribute('x2', el.width - 15); ln.setAttribute('y2', el.height / 2);
                ln.setAttribute('stroke', el.stroke || '#2c5f8a'); ln.setAttribute('stroke-width', sw);
                const ah = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                ah.setAttribute('points', `${el.width},${el.height / 2} ${el.width - 15},${el.height / 2 - 8} ${el.width - 15},${el.height / 2 + 8}`);
                ah.setAttribute('fill', el.stroke || '#2c5f8a');
                shape.appendChild(ln); shape.appendChild(ah);
                break;
            case 'star':
                const pts = [];
                for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? Math.min(el.width, el.height) / 2 - sw : Math.min(el.width, el.height) / 4;
                    const a = (Math.PI / 5) * i - Math.PI / 2;
                    pts.push(`${el.width / 2 + r * Math.cos(a)},${el.height / 2 + r * Math.sin(a)}`);
                }
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shape.setAttribute('points', pts.join(' '));
                break;
            default:
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', el.width); shape.setAttribute('height', el.height);
        }
        if (el.shapeType !== 'arrow') {
            shape.setAttribute('fill', el.shapeType === 'line' ? 'none' : (el.fill || '#4a90d9'));
            shape.setAttribute('stroke', el.stroke || '#2c5f8a');
            shape.setAttribute('stroke-width', sw);
        }
        svg.appendChild(shape);
        return svg;
    },

    renderTable(el) {
        const table = document.createElement('table');
        table.className = 'element-table';
        table.style.cssText = 'width:100%;height:100%;border-collapse:collapse;table-layout:fixed;';
        for (let r = 0; r < el.rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < el.cols; c++) {
                const cell = el.cells?.[r]?.[c];
                if (!cell) continue;
                const td = document.createElement('td');
                td.contentEditable = true;
                td.textContent = cell.content;
                td.style.cssText = `background:${cell.bgColor};color:${cell.color};font-family:'${cell.fontFamily}',sans-serif;font-size:${cell.fontSize}px;font-weight:${cell.fontWeight};text-align:${cell.textAlign};vertical-align:${cell.verticalAlign};border:${cell.borderWidth}px solid ${cell.borderColor};padding:${cell.padding}px;min-width:40px;`;
                if (cell.colSpan > 1) td.colSpan = cell.colSpan;
                if (cell.rowSpan > 1) td.rowSpan = cell.rowSpan;
                td.addEventListener('input', () => el.cells[r][c].content = td.textContent);
                td.addEventListener('mousedown', e => e.stopPropagation());
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    },

    renderWatermark(el) {
        const div = document.createElement('div');
        div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;';

        if (el.subType === 'image' && el.imageSrc) {
            const img = document.createElement('img');
            img.src = el.imageSrc;
            img.style.cssText = `
                max-width: 80%; max-height: 80%; object-fit: contain;
                opacity: ${el.opacity};
                transform: rotate(${el.rotation}deg);
                filter: blur(${el.blur || 0}px);
                user-select: none; pointer-events: none;
            `;
            div.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.textContent = el.text || 'WATERMARK';
            span.style.cssText = `
                font-family: '${el.fontFamily || 'Inter'}', sans-serif;
                font-size: ${el.fontSize || 72}px;
                color: ${el.color || '#ccc'};
                transform: rotate(${el.rotation || -45}deg);
                opacity: ${el.opacity};
                filter: blur(${el.blur || 0}px);
                user-select: none; white-space: nowrap;
            `;
            div.appendChild(span);
        }
        return div;
    },

    renderSignature(el) {
        const div = document.createElement('div');
        div.style.cssText = `width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;border-bottom:${el.borderBottom || '2px solid #333'};`;
        if (el.dataUrl) {
            const img = document.createElement('img');
            img.src = el.dataUrl;
            img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
            img.draggable = false;
            div.appendChild(img);
        } else if (el.text) {
            const span = document.createElement('span');
            span.textContent = el.text;
            span.style.cssText = `font-family:'${el.fontFamily || 'Dancing Script'}',cursive;font-size:${el.fontSize || 28}px;color:${el.color || '#000080'};`;
            div.appendChild(span);
        }
        return div;
    },

    renderComment(el) {
        const div = document.createElement('div');
        div.style.cssText = `width:100%;height:100%;background:${el.color || '#fff9c4'};border:1px solid #e6d985;border-radius:4px;padding:8px;font-size:12px;overflow:auto;box-shadow:2px 2px 8px rgba(0,0,0,0.1);`;
        const header = document.createElement('div');
        header.style.cssText = 'font-weight:bold;font-size:11px;color:#666;margin-bottom:4px;';
        header.textContent = `${el.author || 'User'} · ${new Date(el.date || Date.now()).toLocaleDateString()}`;
        const body = document.createElement('div');
        body.contentEditable = true;
        body.textContent = el.text || '';
        body.style.color = '#333';
        body.addEventListener('input', () => DocModel.updateElement(null, el.id, { text: body.textContent }));
        body.addEventListener('mousedown', e => e.stopPropagation());
        div.appendChild(header); div.appendChild(body);
        return div;
    },

    renderLink(el) {
        const a = document.createElement('a');
        a.href = el.url || '#';
        a.textContent = el.text || 'Link';
        a.target = '_blank';
        a.style.cssText = `font-family:'${el.fontFamily || 'Inter'}',sans-serif;font-size:${el.fontSize || 14}px;color:${el.color || '#0066cc'};text-decoration:underline;cursor:pointer;`;

        // Prevent default click unless Ctrl/Cmd key is held
        a.addEventListener('click', (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                // If not following link, treat as selection
                if (!DocModel.selectedElements.includes(el.id)) {
                    DocModel.selectedElements = [el.id];
                    this.render();
                    if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
                }
            }
        });

        // Add tooltip
        a.title = `Ctrl+Click to open ${el.url}`;

        return a;
    },

    renderPageNumber(pageIdx) {
        const ps = DocModel.pageSettings;
        const div = document.createElement('div');
        const startFrom = ps.pageNumberStartFrom || 1;
        const n = pageIdx + startFrom;
        let num;
        switch (ps.pageNumberFormat) {
            case 'roman': num = this.toRoman(n); break;
            case 'roman-upper': num = this.toRoman(n).toUpperCase(); break;
            case 'alpha': num = String.fromCharCode(96 + (n - 1) % 26 + 1); break;
            case 'alpha-upper': num = String.fromCharCode(64 + (n - 1) % 26 + 1); break;
            default: num = n.toString();
        }
        let text;
        switch (ps.pageNumberStyle) {
            case 'decorated': text = `— ${num} —`; break;
            case 'page-of': text = `Page ${num} of ${DocModel.pages.length + startFrom - 1}`; break;
            default: text = num;
        }
        div.textContent = text;
        const posMap = {
            'top-left': 'top:20px;left:40px;', 'top-center': 'top:20px;left:50%;transform:translateX(-50%);', 'top-right': 'top:20px;right:40px;',
            'bottom-left': 'bottom:20px;left:40px;', 'bottom-center': 'bottom:20px;left:50%;transform:translateX(-50%);', 'bottom-right': 'bottom:20px;right:40px;'
        };
        div.style.cssText = `position:absolute;${posMap[ps.pageNumberPosition] || posMap['bottom-center']}font-family:'Inter',sans-serif;font-size:11px;color:#888;z-index:5;pointer-events:none;`;
        return div;
    },

    toRoman(num) {
        const lookup = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
        let r = '';
        for (let k in lookup) { while (num >= lookup[k]) { r += k; num -= lookup[k]; } }
        return r;
    },

    // ======== EVENTS ========

    setupEvents() {
        // All mouse events are on the document for proper capture
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Ctrl+Wheel zoom
        this.container?.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                this.setZoom(Math.max(0.25, Math.min(3, this.zoom + (e.deltaY > 0 ? -0.1 : 0.1))));
            }
        }, { passive: false });
    },

    // ---- FILE DRAG & DROP ----

    setupFileDrop() {
        if (!this.container) return;

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.container.classList.add('file-drag-over');
        });
        this.container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.container.classList.remove('file-drag-over');
        });
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.container.classList.remove('file-drag-over');

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;

            for (const file of files) {
                if (file.type === 'application/pdf') {
                    PDFHandler.openPDF(file);
                    return;
                }
                if (file.type.startsWith('image/')) {
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
                                ev.target.result, w, w * ratio
                            );
                            DocModel.addElement(DocModel.activePageIndex, el);
                            Canvas.render();
                        };
                        img.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                    return;
                }
            }
            document.getElementById('status-text').textContent = 'Unsupported file type. Drop a PDF or image.';
        });
    },

    // ---- MOUSE EVENTS ----

    getPageRelativePos(e) {
        // Get position relative to the page element under cursor
        const pageEl = e.target.closest('.page');
        if (!pageEl) return null;
        const rect = pageEl.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom,
            y: (e.clientY - rect.top) / this.zoom,
            pageIndex: parseInt(pageEl.dataset.pageIndex)
        };
    },

    onMouseDown(e) {
        // Skip if editing a textbox
        if (this.editingTextbox) return;

        const handle = e.target.closest('.resize-handle');
        const wrapper = e.target.closest('.element-wrapper');
        const pageEl = e.target.closest('.page');

        // Set active page
        if (pageEl) {
            DocModel.activePageIndex = parseInt(pageEl.dataset.pageIndex);
        }

        // ---- RESIZE ----
        if (handle && wrapper) {
            const elId = wrapper.dataset.elementId;
            const pi = parseInt(wrapper.dataset.pageIndex);
            const el = DocModel.getElement(pi, elId);
            if (el && !el.locked) {
                this.isResizing = true;
                this.resizeHandle = handle.dataset.handle;
                this.activeElement = elId;
                this.activePageIndex = pi;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragElStartX = el.x;
                this.dragElStartY = el.y;
                this.dragElStartW = el.width;
                this.dragElStartH = el.height;
                e.preventDefault();
                return;
            }
        }

        // If wrapper is locked, ignore it for drag ops and allow fall-through to rubber-band
        // This fixes "Unable to group select" on PDF backgrounds
        if (wrapper) {
            const elId = wrapper.dataset.elementId;
            const pi = parseInt(wrapper.dataset.pageIndex);
            const el = DocModel.getElement(pi, elId);
            if (el && el.locked) {
                wrapper = null; // Treat as empty click
            }
        }

        // ---- ELEMENT CLICK/DRAG ----
        if (wrapper && !wrapper.querySelector('.element-textbox:focus')) {
            const elId = wrapper.dataset.elementId;
            const pi = parseInt(wrapper.dataset.pageIndex);
            const el = DocModel.getElement(pi, elId);
            if (!el) return;

            // Group-aware selection
            if (e.ctrlKey || e.metaKey) {
                // Toggle in/out of selection
                if (DocModel.selectedElements.includes(elId)) {
                    DocModel.selectedElements = DocModel.selectedElements.filter(id => id !== elId);
                } else {
                    DocModel.selectedElements.push(elId);
                }
            } else if (e.shiftKey) {
                // Add to selection
                if (!DocModel.selectedElements.includes(elId)) {
                    DocModel.selectedElements.push(elId);
                }
            } else {
                // Check if element is in a group
                const groupSelection = DocModel.selectGroup(elId);
                if (!DocModel.selectedElements.includes(elId)) {
                    DocModel.selectedElements = groupSelection;
                }
            }

            // Start drag if not locked
            if (!el.locked) {
                this.isDragging = true;
                this.activeElement = elId;
                this.activePageIndex = pi;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragElStartX = el.x;
                this.dragElStartY = el.y;

                // Store start positions for all selected elements (multi-drag)
                this._multiDragStart = {};
                DocModel.selectedElements.forEach(id => {
                    const selEl = DocModel.getElement(pi, id);
                    if (selEl && !selEl.locked) {
                        this._multiDragStart[id] = { x: selEl.x, y: selEl.y };
                    }
                });
            }

            this.render();
            if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
            e.preventDefault();
            return;
        }

        // ---- RUBBER-BAND SELECTION on empty page area ----
        if (pageEl && !wrapper) {
            const pos = this.getPageRelativePos(e);
            if (pos) {
                // Clear selection unless Ctrl is held
                if (!e.ctrlKey && !e.metaKey) {
                    DocModel.selectedElements = [];
                }
                this.isSelecting = true;
                this.selectPageIndex = pos.pageIndex;
                this.dragStartX = pos.x;
                this.dragStartY = pos.y;

                // Create visual selection rect
                this.selectRect = document.createElement('div');
                this.selectRect.className = 'rubber-band-select';
                this.selectRect.style.cssText = `position:absolute;left:${pos.x}px;top:${pos.y}px;width:0;height:0;border:1px dashed var(--accent, #0078d4);background:rgba(0,120,212,0.08);z-index:9999;pointer-events:none;`;
                pageEl.appendChild(this.selectRect);

                this.render();
            }
            e.preventDefault();
        }
    },

    onMouseMove(e) {
        // ---- RUBBER-BAND SELECTION ----
        if (this.isSelecting && this.selectRect) {
            const pageEl = document.querySelector(`.page[data-page-index="${this.selectPageIndex}"]`);
            if (!pageEl) return;
            const rect = pageEl.getBoundingClientRect();
            const cx = (e.clientX - rect.left) / this.zoom;
            const cy = (e.clientY - rect.top) / this.zoom;

            const x = Math.min(this.dragStartX, cx);
            const y = Math.min(this.dragStartY, cy);
            const w = Math.abs(cx - this.dragStartX);
            const h = Math.abs(cy - this.dragStartY);

            this.selectRect.style.left = x + 'px';
            this.selectRect.style.top = y + 'px';
            this.selectRect.style.width = w + 'px';
            this.selectRect.style.height = h + 'px';
            return;
        }

        if (!this.activeElement) return;
        const dx = (e.clientX - this.dragStartX) / this.zoom;
        const dy = (e.clientY - this.dragStartY) / this.zoom;

        // ---- DRAGGING ----
        if (this.isDragging) {
            // Move ALL selected elements together
            for (const id of DocModel.selectedElements) {
                const start = this._multiDragStart?.[id];
                if (!start) continue;
                let nx = start.x + dx;
                let ny = start.y + dy;
                if (this.snapToGrid) {
                    nx = Math.round(nx / this.gridSize) * this.gridSize;
                    ny = Math.round(ny / this.gridSize) * this.gridSize;
                }
                DocModel.updateElement(this.activePageIndex, id, { x: nx, y: ny });
            }
            this.render();
        }

        // ---- RESIZING ----
        if (this.isResizing) {
            let { x, y } = { x: this.dragElStartX, y: this.dragElStartY };
            let w = this.dragElStartW, h = this.dragElStartH;
            const dir = this.resizeHandle;
            if (dir.includes('e')) w += dx;
            if (dir.includes('w')) { x += dx; w -= dx; }
            if (dir.includes('s')) h += dy;
            if (dir.includes('n')) { y += dy; h -= dy; }
            if (w < 20) w = 20;
            if (h < 20) h = 20;
            DocModel.updateElement(this.activePageIndex, this.activeElement, { x, y, width: w, height: h });
            this.render();
        }
    },

    onMouseUp(e) {
        // ---- FINISH RUBBER-BAND SELECTION ----
        if (this.isSelecting && this.selectRect) {
            const sx = parseFloat(this.selectRect.style.left);
            const sy = parseFloat(this.selectRect.style.top);
            const sw = parseFloat(this.selectRect.style.width);
            const sh = parseFloat(this.selectRect.style.height);

            if (sw > 5 && sh > 5) {
                const page = DocModel.pages[this.selectPageIndex];
                if (page) {
                    page.elements.forEach(el => {
                        if (el.locked) return;
                        // Check if element intersects with selection rect
                        const elRight = el.x + el.width;
                        const elBottom = el.y + el.height;
                        const selRight = sx + sw;
                        const selBottom = sy + sh;
                        if (el.x < selRight && elRight > sx && el.y < selBottom && elBottom > sy) {
                            if (!DocModel.selectedElements.includes(el.id)) {
                                DocModel.selectedElements.push(el.id);
                            }
                        }
                    });
                }
            }

            this.selectRect.remove();
            this.selectRect = null;
            this.isSelecting = false;
            this.render();
            if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
            document.getElementById('status-text').textContent = DocModel.selectedElements.length > 0
                ? `Selected ${DocModel.selectedElements.length} element(s)`
                : 'Ready';
            return;
        }

        // Save state after drag/resize
        if (this.isDragging || this.isResizing) {
            DocModel.saveState();
        } else if (!this.isSelecting) {
            // Simple Click on an element that was already selected?
            // If so, we should reduce selection to just this one (unless Ctrl/Shift)
            if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                const wrapper = e.target.closest('.element-wrapper');
                if (wrapper) {
                    const elId = wrapper.dataset.elementId;
                    if (DocModel.selectedElements.includes(elId) && DocModel.selectedElements.length > 1) {
                        DocModel.selectedElements = [elId];
                        this.render();
                        if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
                    }
                }
            }
        }

        this.isDragging = false;
        this.isResizing = false;
        this.activeElement = null;
        this._multiDragStart = null;
    },

    onKeyDown(e) {
        // Skip when typing in inputs or content-editable elements
        if (e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        // Delete selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
            DocModel.selectedElements.forEach(id => DocModel.removeElement(DocModel.activePageIndex, id));
            DocModel.selectedElements = [];
            this.render();
            e.preventDefault();
        }

        // Undo/Redo
        if (e.ctrlKey && e.key === 'z') { DocModel.undo(); this.render(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'y') { DocModel.redo(); this.render(); e.preventDefault(); }

        // Copy/Paste
        if (e.ctrlKey && e.key === 'c') { this.copySelected(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'v') { this.pasteClipboard(); e.preventDefault(); }

        // Duplicate
        if (e.ctrlKey && e.key === 'd') {
            DocModel.selectedElements.forEach(id => DocModel.duplicateElement(DocModel.activePageIndex, id));
            this.render();
            e.preventDefault();
        }

        // Select all
        if (e.ctrlKey && e.key === 'a') {
            const page = DocModel.getActivePage();
            DocModel.selectedElements = page.elements.filter(e => !e.locked).map(e => e.id);
            this.render();
            e.preventDefault();
        }

        // Group/Ungroup
        if (e.ctrlKey && e.key === 'g') {
            if (e.shiftKey) {
                // Ungroup
                this.ungroupSelected();
            } else {
                this.groupSelected();
            }
            e.preventDefault();
        }

        // Arrow key nudge
        const nudge = e.shiftKey ? 10 : 1;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && DocModel.selectedElements.length) {
            DocModel.selectedElements.forEach(id => {
                const el = DocModel.getElement(DocModel.activePageIndex, id);
                if (!el || el.locked) return;
                if (e.key === 'ArrowUp') el.y -= nudge;
                if (e.key === 'ArrowDown') el.y += nudge;
                if (e.key === 'ArrowLeft') el.x -= nudge;
                if (e.key === 'ArrowRight') el.x += nudge;
            });
            DocModel.saveState();
            this.render();
            e.preventDefault();
        }
    },

    // ======== GROUPING ========

    groupSelected() {
        if (DocModel.selectedElements.length < 2) {
            document.getElementById('status-text').textContent = 'Select 2+ elements to group (Ctrl+G)';
            return;
        }
        const gid = DocModel.groupElements(DocModel.selectedElements);
        this.render();
        document.getElementById('status-text').textContent = `Grouped ${DocModel.selectedElements.length} elements`;
    },

    ungroupSelected() {
        let ungrouped = 0;
        DocModel.selectedElements.forEach(id => {
            const el = DocModel.getElement(DocModel.activePageIndex, id);
            if (el && el.groupId) {
                DocModel.ungroupElements(el.groupId);
                ungrouped++;
            }
        });
        this.render();
        document.getElementById('status-text').textContent = ungrouped > 0 ? 'Elements ungrouped' : 'No groups to ungroup';
    },

    // ======== CLIPBOARD ========

    clipboard: [],

    copySelected() {
        this.clipboard = DocModel.selectedElements.map(id =>
            JSON.parse(JSON.stringify(DocModel.getElement(DocModel.activePageIndex, id)))
        ).filter(Boolean);
        document.getElementById('status-text').textContent = `Copied ${this.clipboard.length} element(s)`;
    },

    pasteClipboard() {
        if (this.clipboard.length === 0) return;
        const newIds = [];
        this.clipboard.forEach(el => {
            const clone = JSON.parse(JSON.stringify(el));
            clone.id = null; // Force new ID
            clone.x += 20;
            clone.y += 20;
            const added = DocModel.addElement(DocModel.activePageIndex, clone);
            newIds.push(added.id);
        });
        DocModel.selectedElements = newIds;
        this.render();
        document.getElementById('status-text').textContent = `Pasted ${newIds.length} element(s)`;
    },

    // ======== ZOOM ========

    setZoom(level) {
        this.zoom = Math.round(level * 100) / 100;
        const zoomEl = document.getElementById('zoom-level');
        if (zoomEl) zoomEl.textContent = Math.round(this.zoom * 100) + '%';
        this.render();
    },

    // ======== THUMBNAILS ========

    updateThumbnails() {
        const panel = document.getElementById('nav-thumbnails');
        if (!panel) return;
        panel.innerHTML = '';
        DocModel.pages.forEach((page, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumbnail' + (idx === DocModel.activePageIndex ? ' active' : '');
            thumb.innerHTML = `<div class="thumb-preview" style="background:${page.backgroundColor || '#fff'}"><span>${idx + 1}</span></div>`;
            thumb.addEventListener('click', () => {
                DocModel.activePageIndex = idx;
                this.render();
                document.querySelectorAll('.page-wrapper')[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            panel.appendChild(thumb);
        });
    }
};

window.Canvas = Canvas;
