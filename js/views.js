// views.js — View modes, dark mode, navigation pane
const ViewManager = {
    currentMode: 'print-layout',
    darkMode: true, // Match the initial body class="dark-mode"

    init() {
        // Sync dark mode state with body class
        this.darkMode = document.body.classList.contains('dark-mode');
        document.getElementById('btn-dark-mode')?.classList.toggle('active', this.darkMode);
        this.setMode('print-layout');
    },

    setMode(mode) {
        this.currentMode = mode;
        const container = document.getElementById('document-area');
        if (!container) return;

        // Reset all view classes
        container.className = 'document-area';
        container.classList.add(`view-${mode}`);

        // Update active states on view buttons
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Remove focus/immersive body classes first
        if (mode !== 'focus') document.body.classList.remove('focus-active');
        if (mode !== 'immersive') document.body.classList.remove('immersive-active');

        switch (mode) {
            case 'read':
                container.classList.add('read-mode');
                break;
            case 'print-layout':
                container.classList.add('print-layout');
                break;
            case 'web-layout':
                container.classList.add('web-layout');
                break;
            case 'outline':
                container.classList.add('outline-mode');
                document.getElementById('nav-panel')?.classList.add('show');
                this.showOutline();
                break;
            case 'focus':
                container.classList.add('focus-mode');
                document.body.classList.add('focus-active');
                break;
            case 'immersive':
                container.classList.add('immersive-mode');
                document.body.classList.add('immersive-active');
                break;
        }

        Canvas.render();
    },

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode', this.darkMode);
        document.getElementById('btn-dark-mode')?.classList.toggle('active', this.darkMode);

        // Update status
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = this.darkMode ? 'Dark mode enabled' : 'Light mode enabled';
    },

    showOutline() {
        const panel = document.getElementById('outline-content');
        if (!panel) return;
        panel.innerHTML = '<h4 style="margin:0 0 8px;color:var(--text-primary)">Document Outline</h4>';
        DocModel.pages.forEach((page, idx) => {
            const item = document.createElement('div');
            item.className = 'outline-item';
            item.innerHTML = `<span class="outline-page">Page ${idx + 1}</span>`;
            const headings = page.elements.filter(el => el.type === 'textbox' && el.fontSize >= 20);
            headings.forEach(h => {
                const sub = document.createElement('div');
                sub.className = 'outline-heading';
                const tmp = document.createElement('div');
                tmp.innerHTML = h.content;
                sub.textContent = tmp.textContent.substring(0, 60);
                item.appendChild(sub);
            });
            item.addEventListener('click', () => {
                DocModel.activePageIndex = idx;
                Canvas.render();
                document.querySelectorAll('.page-wrapper')[idx]?.scrollIntoView({ behavior: 'smooth' });
            });
            panel.appendChild(item);
        });
    },

    setPageMovement(type) {
        const container = document.getElementById('pages-container');
        if (!container) return;
        container.classList.remove('vertical-scroll', 'side-by-side');
        container.classList.add(type === 'side' ? 'side-by-side' : 'vertical-scroll');
    }
};

window.ViewManager = ViewManager;
