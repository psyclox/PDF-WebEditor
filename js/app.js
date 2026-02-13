// app.js — Main application controller
const App = {
    init() {
        // Initialize all modules
        FontManager.init();
        DocModel.init();
        Canvas.init();
        Toolbar.init();
        ViewManager.init();
        PageSettings.init();

        // Status bar
        document.getElementById('status-text').textContent = 'Ready';
        this.updatePageInfo();

        // File menu
        this.setupFileMenu();

        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (DocModel.history.length > 1) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Close dialogs on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Toolbar.closeAllDialogs();
                document.getElementById('find-replace-panel')?.classList.remove('show');
                document.getElementById('file-menu')?.classList.remove('show');
                if (document.body.classList.contains('focus-active') || document.body.classList.contains('immersive-active')) {
                    ViewManager.setMode('print-layout');
                }
            }
        });

        // Context menu
        document.getElementById('pages-container')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });

        // Find/replace
        document.getElementById('find-btn')?.addEventListener('click', () => this.findText());
        document.getElementById('replace-btn')?.addEventListener('click', () => this.replaceText());
        document.getElementById('replace-all-btn')?.addEventListener('click', () => this.replaceAllText());

        // Hidden file input for PDF/JSON open
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'hidden-file-input';
        fileInput.accept = '.pdf,.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.name.toLowerCase().endsWith('.pdf')) {
                PDFHandler.openPDF(file);
            } else if (file.name.toLowerCase().endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    DocModel.deserialize(ev.target.result);
                    Canvas.render();
                };
                reader.readAsText(file);
            }
            fileInput.value = ''; // Reset so same file can be re-selected
        });
        document.body.appendChild(fileInput);

        console.log('ProEditor initialized');
    },

    setupFileMenu() {
        const fileTab = document.querySelector('.ribbon-tab[data-tab="file"]');
        if (!fileTab) return;

        // Override the default tab switching for the File tab — show file menu instead
        fileTab.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            // Close other panels and active states, but don't select the File "panel"
            const menu = document.getElementById('file-menu');
            if (menu) {
                const isOpen = menu.classList.contains('show');
                // Close any open dropdown/menus first
                Toolbar.closeAllDialogs();
                document.getElementById('file-menu')?.classList.remove('show');

                if (!isOpen) {
                    menu.classList.add('show');
                }
            }
        });

        // Close file menu on click outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('file-menu');
            if (menu && !menu.contains(e.target) && !e.target.closest('.ribbon-tab[data-tab="file"]')) {
                menu.classList.remove('show');
            }
        });
    },

    updatePageInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${DocModel.activePageIndex + 1} of ${DocModel.pages.length}`;
        }
    },

    showContextMenu(e) {
        const existing = document.getElementById('context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;`;

        const items = [];
        if (DocModel.selectedElements.length > 0) {
            items.push(
                { label: '✂️ Cut', action: () => { Canvas.copySelected(); DocModel.selectedElements.forEach(id => DocModel.removeElement(DocModel.activePageIndex, id)); DocModel.selectedElements = []; Canvas.render(); } },
                { label: '📋 Copy', action: () => Canvas.copySelected() },
                { label: '📄 Duplicate', shortcut: 'Ctrl+D', action: () => { DocModel.selectedElements.forEach(id => DocModel.duplicateElement(DocModel.activePageIndex, id)); Canvas.render(); } },
                { label: '---' },
                { label: '⬆️ Bring to Front', action: () => { DocModel.selectedElements.forEach(id => DocModel.bringToFront(DocModel.activePageIndex, id)); Canvas.render(); } },
                { label: '⬇️ Send to Back', action: () => { DocModel.selectedElements.forEach(id => DocModel.sendToBack(DocModel.activePageIndex, id)); Canvas.render(); } },
                { label: '---' },
                { label: '🔒 Lock/Unlock', action: () => { DocModel.selectedElements.forEach(id => { const el = DocModel.getElement(DocModel.activePageIndex, id); if (el) DocModel.updateElement(DocModel.activePageIndex, id, { locked: !el.locked }); }); Canvas.render(); } },
                { label: '🔗 Group', shortcut: 'Ctrl+G', action: () => Canvas.groupSelected() },
                { label: '🔓 Ungroup', shortcut: 'Ctrl+Shift+G', action: () => Canvas.ungroupSelected() },
                { label: '🗑️ Delete', action: () => { DocModel.selectedElements.forEach(id => DocModel.removeElement(DocModel.activePageIndex, id)); DocModel.selectedElements = []; Canvas.render(); } }
            );
        } else {
            items.push(
                { label: '📋 Paste', action: () => Canvas.pasteClipboard() },
                { label: '---' },
                { label: '📝 Insert Text', action: () => Toolbar.insertElement('textbox') },
                { label: '🖼️ Insert Image', action: () => Toolbar.insertImage() },
                { label: '🔗 Insert Link', action: () => Toolbar.showLinkDialog() },
                { label: '📊 Insert Table', action: () => Toolbar.showTableDialog() },
                { label: '---' },
                { label: '➕ Add Page', action: () => { DocModel.addPage(DocModel.activePageIndex); Canvas.render(); } },
                { label: '🔍 Select All', shortcut: 'Ctrl+A', action: () => { const page = DocModel.getActivePage(); DocModel.selectedElements = page.elements.map(e => e.id); Canvas.render(); } }
            );
        }

        items.forEach(item => {
            if (item.label === '---') {
                const sep = document.createElement('div');
                sep.className = 'context-separator';
                menu.appendChild(sep);
            } else {
                const btn = document.createElement('div');
                btn.className = 'context-item';
                btn.innerHTML = `<span>${item.label}</span>${item.shortcut ? `<span class="context-shortcut">${item.shortcut}</span>` : ''}`;
                btn.addEventListener('click', () => { item.action(); menu.remove(); });
                menu.appendChild(btn);
            }
        });

        document.body.appendChild(menu);
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 10);
    },

    findText() {
        const query = document.getElementById('find-input')?.value;
        if (!query) return;

        let found = false;
        // Search all pages
        for (let pIdx = 0; pIdx < DocModel.pages.length; pIdx++) {
            const page = DocModel.pages[pIdx];
            for (const el of page.elements) {
                if (el.type === 'textbox') {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = el.content;
                    if (tmp.textContent.toLowerCase().includes(query.toLowerCase())) {
                        DocModel.activePageIndex = pIdx;
                        DocModel.selectedElements = [el.id];
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }

        Canvas.render();
        document.getElementById('status-text').textContent = found ? 'Match found' : 'Text not found';
        this.updatePageInfo();
    },

    replaceText() {
        const query = document.getElementById('find-input')?.value;
        const replacement = document.getElementById('replace-input')?.value;
        if (!query) return;

        let replaced = 0;
        DocModel.selectedElements.forEach(id => {
            const el = DocModel.getElement(DocModel.activePageIndex, id);
            if (el && el.type === 'textbox') {
                const before = el.content;
                el.content = el.content.replace(new RegExp(this.escapeRegex(query), 'i'), replacement || '');
                if (before !== el.content) replaced++;
            }
        });
        DocModel.saveState();
        Canvas.render();
        document.getElementById('status-text').textContent = replaced > 0 ? `Replaced ${replaced} occurrence(s)` : 'Nothing to replace';
    },

    replaceAllText() {
        const query = document.getElementById('find-input')?.value;
        const replacement = document.getElementById('replace-input')?.value;
        if (!query) return;

        let replaced = 0;
        DocModel.pages.forEach(page => {
            page.elements.forEach(el => {
                if (el.type === 'textbox') {
                    const before = el.content;
                    el.content = el.content.replace(new RegExp(this.escapeRegex(query), 'gi'), replacement || '');
                    if (before !== el.content) replaced++;
                }
            });
        });
        DocModel.saveState();
        Canvas.render();
        document.getElementById('status-text').textContent = `Replaced in ${replaced} element(s)`;
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
