// canvas.js — Page rendering engine & element interaction
const Canvas = {
    container: null,
    pagesContainer: null,
    zoom: 1,
    isDragging: false,
    isResizing: false,
    resizeHandle: '',
    dragStartX: 0,
    dragStartY: 0,
    dragElStartX: 0,
    dragElStartY: 0,
    activeElement: null,
    activePageIndex: 0,
    showRuler: true,
    showGridlines: false,
    snapToGrid: true,
    gridSize: 10,

    init() {
        this.container = document.getElementById('document-area');
        this.pagesContainer = document.getElementById('pages-container');
        this.setupEvents();
        this.render();
    },

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
            pageEl.style.backgroundColor = page.backgroundColor || ps.backgroundColor;
            pageEl.style.transform = `scale(${this.zoom})`;
            pageEl.style.transformOrigin = 'top center';

            // Margin guides
            if (this.showGridlines) {
                const guides = document.createElement('div');
                guides.className = 'margin-guides';
                guides.style.cssText = `position:absolute;top:${ps.marginTop}px;left:${ps.marginLeft}px;right:${ps.marginRight}px;bottom:${ps.marginBottom}px;border:1px dashed rgba(0,120,215,0.3);pointer-events:none;z-index:0;`;
                pageEl.appendChild(guides);
            }

            // Render elements sorted by z-index
            const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
            sorted.forEach(el => {
                if (!el.visible) return;
                const dom = this.renderElement(el, pageIdx);
                if (dom) pageEl.appendChild(dom);
            });

            // Page number
            if (ps.pageNumberStyle !== 'none') {
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
    },

    renderElement(el, pageIdx) {
        const wrapper = document.createElement('div');
        wrapper.className = 'element-wrapper';
        wrapper.dataset.elementId = el.id;
        wrapper.dataset.pageIndex = pageIdx;
        wrapper.dataset.type = el.type;
        wrapper.style.cssText = `
            position:absolute;left:${el.x}px;top:${el.y}px;
            width:${el.width}px;height:${el.height}px;
            opacity:${el.opacity};z-index:${el.zIndex + 10};
            transform:rotate(${el.rotation || 0}deg);
            cursor:${el.locked ? 'default' : 'move'};
        `;

        const isSelected = DocModel.selectedElements.includes(el.id);
        if (isSelected) wrapper.classList.add('selected');

        let content;
        switch (el.type) {
            case 'textbox': content = this.renderTextBox(el); break;
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

        // Resize handles
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

    renderTextBox(el) {
        const div = document.createElement('div');
        div.className = 'element-textbox';
        div.contentEditable = !el.locked;
        div.innerHTML = el.content;
        div.style.cssText = `
            width:100%;height:100%;
            font-family:'${el.fontFamily}',sans-serif;
            font-size:${el.fontSize}px;font-weight:${el.fontWeight};
            font-style:${el.fontStyle};text-decoration:${el.textDecoration};
            text-align:${el.textAlign};color:${el.color};
            line-height:${el.lineHeight};letter-spacing:${el.letterSpacing}px;
            word-spacing:${el.wordSpacing}px;
            background:${el.backgroundColor};padding:${el.padding}px;
            border:${el.borderWidth}px solid ${el.borderColor};
            outline:none;overflow:auto;box-sizing:border-box;
        `;
        div.addEventListener('input', (e) => {
            DocModel.updateElement(null, el.id, { content: e.target.innerHTML });
        });
        div.addEventListener('mousedown', (e) => e.stopPropagation());
        return div;
    },

    renderImage(el) {
        const container = document.createElement('div');
        container.className = 'element-image-container';
        container.style.cssText = `width:100%;height:100%;overflow:hidden;border-radius:${el.borderRadius}px;border:${el.borderWidth}px solid ${el.borderColor};`;

        const img = document.createElement('img');
        img.src = el.src;
        img.style.cssText = `
            width:100%;height:100%;object-fit:${el.objectFit};
            filter:brightness(${el.brightness}%) contrast(${el.contrast}%) saturate(${el.saturation}%) hue-rotate(${el.hue}deg) blur(${el.blur}px);
            clip-path:inset(${el.cropTop}% ${el.cropRight}% ${el.cropBottom}% ${el.cropLeft}%);
        `;
        img.draggable = false;
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
        switch (el.shapeType) {
            case 'rectangle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('x', el.strokeWidth);
                shape.setAttribute('y', el.strokeWidth);
                shape.setAttribute('width', el.width - el.strokeWidth * 2);
                shape.setAttribute('height', el.height - el.strokeWidth * 2);
                shape.setAttribute('rx', el.borderRadius || 0);
                break;
            case 'circle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                shape.setAttribute('cx', el.width / 2);
                shape.setAttribute('cy', el.height / 2);
                shape.setAttribute('rx', el.width / 2 - el.strokeWidth);
                shape.setAttribute('ry', el.height / 2 - el.strokeWidth);
                break;
            case 'triangle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shape.setAttribute('points', `${el.width / 2},${el.strokeWidth} ${el.width - el.strokeWidth},${el.height - el.strokeWidth} ${el.strokeWidth},${el.height - el.strokeWidth}`);
                break;
            case 'line':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                shape.setAttribute('x1', 0);
                shape.setAttribute('y1', el.height / 2);
                shape.setAttribute('x2', el.width);
                shape.setAttribute('y2', el.height / 2);
                break;
            case 'arrow':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', 0);
                line.setAttribute('y1', el.height / 2);
                line.setAttribute('x2', el.width - 15);
                line.setAttribute('y2', el.height / 2);
                line.setAttribute('stroke', el.stroke);
                line.setAttribute('stroke-width', el.strokeWidth);
                const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                arrowHead.setAttribute('points', `${el.width},${el.height / 2} ${el.width - 15},${el.height / 2 - 8} ${el.width - 15},${el.height / 2 + 8}`);
                arrowHead.setAttribute('fill', el.stroke);
                shape.appendChild(line);
                shape.appendChild(arrowHead);
                break;
            case 'star':
                const pts = [];
                for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? Math.min(el.width, el.height) / 2 - el.strokeWidth : Math.min(el.width, el.height) / 4;
                    const angle = (Math.PI / 5) * i - Math.PI / 2;
                    pts.push(`${el.width / 2 + r * Math.cos(angle)},${el.height / 2 + r * Math.sin(angle)}`);
                }
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                shape.setAttribute('points', pts.join(' '));
                break;
            default:
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', el.width);
                shape.setAttribute('height', el.height);
        }

        if (el.shapeType !== 'arrow') {
            shape.setAttribute('fill', el.shapeType === 'line' ? 'none' : el.fill);
            shape.setAttribute('stroke', el.stroke);
            shape.setAttribute('stroke-width', el.strokeWidth);
        }

        svg.appendChild(shape);
        return svg;
    },

    renderTable(el) {
        const table = document.createElement('table');
        table.className = 'element-table';
        table.style.cssText = `width:100%;height:100%;border-collapse:collapse;table-layout:fixed;`;

        for (let r = 0; r < el.rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < el.cols; c++) {
                const cell = el.cells[r]?.[c];
                if (!cell) continue;
                const td = document.createElement('td');
                td.contentEditable = true;
                td.textContent = cell.content;
                td.style.cssText = `
                    background:${cell.bgColor};color:${cell.color};
                    font-family:'${cell.fontFamily}',sans-serif;font-size:${cell.fontSize}px;
                    font-weight:${cell.fontWeight};text-align:${cell.textAlign};
                    vertical-align:${cell.verticalAlign};
                    border:${cell.borderWidth}px solid ${cell.borderColor};
                    padding:${cell.padding}px;min-width:40px;
                `;
                if (cell.colSpan > 1) td.colSpan = cell.colSpan;
                if (cell.rowSpan > 1) td.rowSpan = cell.rowSpan;
                td.addEventListener('input', (e) => {
                    el.cells[r][c].content = e.target.textContent;
                });
                td.addEventListener('mousedown', (e) => e.stopPropagation());
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    },

    renderWatermark(el) {
        const div = document.createElement('div');
        div.className = 'element-watermark';
        div.style.cssText = `
            width:100%;height:100%;display:flex;align-items:center;justify-content:center;
            pointer-events:none;
        `;
        if (el.imageSrc) {
            const img = document.createElement('img');
            img.src = el.imageSrc;
            img.style.cssText = `max-width:80%;max-height:80%;opacity:${el.opacity};transform:rotate(${el.rotation}deg);`;
            div.appendChild(img);
        } else {
            const text = document.createElement('span');
            text.textContent = el.text;
            text.style.cssText = `
                font-family:'${el.fontFamily}',sans-serif;font-size:${el.fontSize}px;
                color:${el.color};transform:rotate(${el.rotation}deg);
                user-select:none;white-space:nowrap;
            `;
            div.appendChild(text);
        }
        return div;
    },

    renderSignature(el) {
        const div = document.createElement('div');
        div.className = 'element-signature';
        div.style.cssText = `width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;border-bottom:${el.borderBottom};`;

        if (el.dataUrl) {
            const img = document.createElement('img');
            img.src = el.dataUrl;
            img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
            img.draggable = false;
            div.appendChild(img);
        } else if (el.text) {
            const span = document.createElement('span');
            span.textContent = el.text;
            span.style.cssText = `font-family:'${el.fontFamily}',cursive;font-size:${el.fontSize}px;color:${el.color};`;
            div.appendChild(span);
        } else {
            div.innerHTML = '<span style="color:#999;font-size:12px;">Click to add signature</span>';
        }
        return div;
    },

    renderComment(el) {
        const div = document.createElement('div');
        div.className = 'element-comment';
        div.style.cssText = `
            width:100%;height:100%;background:${el.color};
            border:1px solid #e6d985;border-radius:4px;padding:8px;
            font-size:12px;overflow:auto;box-shadow:2px 2px 8px rgba(0,0,0,0.1);
        `;
        const header = document.createElement('div');
        header.style.cssText = 'font-weight:bold;font-size:11px;color:#666;margin-bottom:4px;';
        header.textContent = `${el.author} · ${new Date(el.date).toLocaleDateString()}`;
        const body = document.createElement('div');
        body.contentEditable = true;
        body.textContent = el.text;
        body.style.cssText = 'color:#333;';
        body.addEventListener('input', (e) => {
            DocModel.updateElement(null, el.id, { text: e.target.textContent });
        });
        body.addEventListener('mousedown', (e) => e.stopPropagation());
        div.appendChild(header);
        div.appendChild(body);
        return div;
    },

    renderLink(el) {
        const a = document.createElement('a');
        a.href = el.url;
        a.textContent = el.text;
        a.target = '_blank';
        a.style.cssText = `
            font-family:'${el.fontFamily}',sans-serif;font-size:${el.fontSize}px;
            color:${el.color};text-decoration:${el.textDecoration};
            cursor:pointer;
        `;
        a.addEventListener('mousedown', (e) => e.stopPropagation());
        return a;
    },

    renderPageNumber(pageIdx) {
        const ps = DocModel.pageSettings;
        if (pageIdx === 0 && !ps.showOnFirstPage) return null;

        const div = document.createElement('div');
        div.className = 'page-number';

        let num;
        const n = pageIdx + (ps.pageNumberStartFrom || 1);
        switch (ps.pageNumberFormat) {
            case 'roman': num = this.toRoman(n); break;
            case 'roman-upper': num = this.toRoman(n).toUpperCase(); break;
            case 'alpha': num = String.fromCharCode(96 + n); break;
            case 'alpha-upper': num = String.fromCharCode(64 + n); break;
            default: num = n.toString();
        }

        div.textContent = `${ps.pageNumberPrefix || ''}${num}${ps.pageNumberSuffix || ''}`;

        const posMap = {
            'top-left': 'top:20px;left:40px;',
            'top-center': 'top:20px;left:50%;transform:translateX(-50%);',
            'top-right': 'top:20px;right:40px;',
            'bottom-left': 'bottom:20px;left:40px;',
            'bottom-center': 'bottom:20px;left:50%;transform:translateX(-50%);',
            'bottom-right': 'bottom:20px;right:40px;'
        };

        div.style.cssText = `
            position:absolute;${posMap[ps.pageNumberPosition] || posMap['bottom-center']}
            font-family:'Inter',sans-serif;font-size:11px;color:#888;z-index:5;
        `;
        return div;
    },

    toRoman(num) {
        const lookup = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
        let roman = '';
        for (let k in lookup) { while (num >= lookup[k]) { roman += k; num -= lookup[k]; } }
        return roman;
    },

    setupEvents() {
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Zoom
        this.container?.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.setZoom(Math.max(0.25, Math.min(3, this.zoom + delta)));
            }
        }, { passive: false });
    },

    onMouseDown(e) {
        const wrapper = e.target.closest('.element-wrapper');
        const handle = e.target.closest('.resize-handle');
        const page = e.target.closest('.page');

        if (page) {
            DocModel.activePageIndex = parseInt(page.dataset.pageIndex);
        }

        if (handle && wrapper) {
            this.isResizing = true;
            this.resizeHandle = handle.dataset.handle;
            this.activeElement = wrapper.dataset.elementId;
            this.activePageIndex = parseInt(wrapper.dataset.pageIndex);
            const el = DocModel.getElement(this.activePageIndex, this.activeElement);
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragElStartX = el.x;
            this.dragElStartY = el.y;
            this.dragElStartW = el.width;
            this.dragElStartH = el.height;
            e.preventDefault();
            return;
        }

        if (wrapper) {
            const elId = wrapper.dataset.elementId;
            const pageIdx = parseInt(wrapper.dataset.pageIndex);
            const el = DocModel.getElement(pageIdx, elId);

            if (el && el.locked) return;

            if (e.ctrlKey) {
                if (DocModel.selectedElements.includes(elId)) {
                    DocModel.selectedElements = DocModel.selectedElements.filter(id => id !== elId);
                } else {
                    DocModel.selectedElements.push(elId);
                }
            } else {
                if (!DocModel.selectedElements.includes(elId)) {
                    DocModel.selectedElements = [elId];
                }
            }

            if (el && !el.locked && wrapper.dataset.type !== 'textbox') {
                this.isDragging = true;
                this.activeElement = elId;
                this.activePageIndex = pageIdx;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragElStartX = el.x;
                this.dragElStartY = el.y;
            }

            this.render();
            if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
            e.preventDefault();
        } else if (page && !wrapper) {
            DocModel.selectedElements = [];
            this.render();
            if (typeof Toolbar !== 'undefined') Toolbar.updateFromSelection();
        }
    },

    onMouseMove(e) {
        if (!this.activeElement) return;
        const dx = (e.clientX - this.dragStartX) / this.zoom;
        const dy = (e.clientY - this.dragStartY) / this.zoom;

        if (this.isDragging) {
            let newX = this.dragElStartX + dx;
            let newY = this.dragElStartY + dy;
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }
            DocModel.updateElement(this.activePageIndex, this.activeElement, { x: newX, y: newY });
            this.render();
        } else if (this.isResizing) {
            const el = DocModel.getElement(this.activePageIndex, this.activeElement);
            let { x, y, width: w, height: h } = { x: this.dragElStartX, y: this.dragElStartY, width: this.dragElStartW, height: this.dragElStartH };

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
        if (this.isDragging || this.isResizing) {
            DocModel.saveState();
        }
        this.isDragging = false;
        this.isResizing = false;
        this.activeElement = null;
    },

    onKeyDown(e) {
        if (e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            DocModel.selectedElements.forEach(id => {
                DocModel.removeElement(DocModel.activePageIndex, id);
            });
            DocModel.selectedElements = [];
            this.render();
            e.preventDefault();
        }

        if (e.ctrlKey && e.key === 'z') { DocModel.undo(); this.render(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'y') { DocModel.redo(); this.render(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'c') { this.copySelected(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'v') { this.pasteClipboard(); e.preventDefault(); }
        if (e.ctrlKey && e.key === 'd') {
            DocModel.selectedElements.forEach(id => DocModel.duplicateElement(DocModel.activePageIndex, id));
            this.render();
            e.preventDefault();
        }
        if (e.ctrlKey && e.key === 'a') {
            const page = DocModel.getActivePage();
            DocModel.selectedElements = page.elements.map(e => e.id);
            this.render();
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
            this.render();
            e.preventDefault();
        }
    },

    clipboard: [],

    copySelected() {
        this.clipboard = DocModel.selectedElements.map(id =>
            JSON.parse(JSON.stringify(DocModel.getElement(DocModel.activePageIndex, id)))
        ).filter(Boolean);
    },

    pasteClipboard() {
        this.clipboard.forEach(el => {
            const clone = JSON.parse(JSON.stringify(el));
            clone.x += 20;
            clone.y += 20;
            const added = DocModel.addElement(DocModel.activePageIndex, clone);
            DocModel.selectedElements = [added.id];
        });
        this.render();
    },

    setZoom(level) {
        this.zoom = level;
        document.getElementById('zoom-level')?.textContent && (document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%');
        this.render();
    },

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
