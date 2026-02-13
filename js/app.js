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

        console.log('ProEditor initialized');
    },

    setupFileMenu() {
        const fileTab = document.querySelector('.ribbon-tab[data-tab="file"]');
        if (!fileTab) return;

        fileTab.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('file-menu');
            if (menu) menu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            document.getElementById('file-menu')?.classList.remove('show');
        });
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
                { label: '🗑️ Delete', action: () => { DocModel.selectedElements.forEach(id => DocModel.removeElement(DocModel.activePageIndex, id)); DocModel.selectedElements = []; Canvas.render(); } }
            );
        } else {
            items.push(
                { label: '📋 Paste', action: () => Canvas.pasteClipboard() },
                { label: '---' },
                { label: '📝 Insert Text', action: () => Toolbar.insertElement('textbox') },
                { label: '🖼️ Insert Image', action: () => Toolbar.insertImage() },
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
        document.addEventListener('click', () => menu.remove(), { once: true });
    },

    findText() {
        const query = document.getElementById('find-input')?.value;
        if (!query) return;

        const page = DocModel.getActivePage();
        let found = false;
        page.elements.forEach(el => {
            if (el.type === 'textbox') {
                const tmp = document.createElement('div');
                tmp.innerHTML = el.content;
                if (tmp.textContent.toLowerCase().includes(query.toLowerCase())) {
                    DocModel.selectedElements = [el.id];
                    found = true;
                }
            }
        });
        Canvas.render();
        if (!found) {
            document.getElementById('status-text').textContent = 'Text not found';
        }
    },

    replaceText() {
        const query = document.getElementById('find-input')?.value;
        const replacement = document.getElementById('replace-input')?.value;
        if (!query) return;

        DocModel.selectedElements.forEach(id => {
            const el = DocModel.getElement(DocModel.activePageIndex, id);
            if (el && el.type === 'textbox') {
                el.content = el.content.replace(new RegExp(this.escapeRegex(query), 'gi'), replacement || '');
            }
        });
        Canvas.render();
    },

    replaceAllText() {
        const query = document.getElementById('find-input')?.value;
        const replacement = document.getElementById('replace-input')?.value;
        if (!query) return;

        DocModel.pages.forEach(page => {
            page.elements.forEach(el => {
                if (el.type === 'textbox') {
                    el.content = el.content.replace(new RegExp(this.escapeRegex(query), 'gi'), replacement || '');
                }
            });
        });
        DocModel.saveState();
        Canvas.render();
        document.getElementById('status-text').textContent = 'All occurrences replaced';
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
