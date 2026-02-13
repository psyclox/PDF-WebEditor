// page-settings.js — Page margins, size, orientation, page numbers, columns
const PageSettings = {
    init() {
        this.setupCustomMarginControls();
        this.setupPageNumberControls();
        this.setupColumnControls();
    },

    setupCustomMarginControls() {
        ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(prop => {
            const input = document.getElementById(prop);
            input?.addEventListener('change', (e) => {
                DocModel.pageSettings[prop] = parseInt(e.target.value) || 96;
                DocModel.saveState();
                Canvas.render();
            });
        });
    },

    setupPageNumberControls() {
        document.getElementById('pagenum-format')?.addEventListener('change', (e) => {
            DocModel.pageSettings.pageNumberFormat = e.target.value;
            Canvas.render();
        });

        document.getElementById('pagenum-position')?.addEventListener('change', (e) => {
            DocModel.pageSettings.pageNumberPosition = e.target.value;
            Canvas.render();
        });

        document.getElementById('pagenum-style')?.addEventListener('change', (e) => {
            DocModel.pageSettings.pageNumberStyle = e.target.value;
            Canvas.render();
        });

        document.getElementById('pagenum-start')?.addEventListener('change', (e) => {
            DocModel.pageSettings.pageNumberStartFrom = parseInt(e.target.value) || 1;
            Canvas.render();
        });

        document.getElementById('pagenum-apply')?.addEventListener('click', () => {
            Toolbar.closeAllDialogs();
            Canvas.render();
        });
    },

    setupColumnControls() {
        document.querySelectorAll('.column-option').forEach(btn => {
            btn.addEventListener('click', () => {
                DocModel.pageSettings.columns = parseInt(btn.dataset.columns) || 1;
                Canvas.render();
            });
        });
    },

    getPageDimensionsInches() {
        const ps = DocModel.pageSettings;
        return {
            width: (ps.width / 96).toFixed(2),
            height: (ps.height / 96).toFixed(2)
        };
    }
};

window.PageSettings = PageSettings;
