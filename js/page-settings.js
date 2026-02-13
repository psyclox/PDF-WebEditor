// page-settings.js — Page settings: custom margins, page numbers, columns
const PageSettings = {
    init() {
        this.setupCustomMarginControls();
        this.setupPageNumberControls();
        this.setupColumnControls();
    },

    setupCustomMarginControls() {
        ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    const val = parseInt(input.value);
                    if (!isNaN(val) && val >= 0 && val < 500) {
                        DocModel.pageSettings[id] = val;
                        DocModel.saveState();
                        Canvas.render();
                        document.getElementById('status-text').textContent = `${id} set to ${val}px`;
                    }
                });
            }
        });
    },

    setupPageNumberControls() {
        // Already handled in toolbar.js via the pagenum-apply button
        // This provides alternative direct access
        const styleEl = document.getElementById('pagenum-style');
        const formatEl = document.getElementById('pagenum-format');
        const positionEl = document.getElementById('pagenum-position');
        const startEl = document.getElementById('pagenum-start');

        if (styleEl) {
            styleEl.addEventListener('change', () => {
                DocModel.pageSettings.pageNumberStyle = styleEl.value;
            });
        }
        if (formatEl) {
            formatEl.addEventListener('change', () => {
                DocModel.pageSettings.pageNumberFormat = formatEl.value;
            });
        }
        if (positionEl) {
            positionEl.addEventListener('change', () => {
                DocModel.pageSettings.pageNumberPosition = positionEl.value;
            });
        }
        if (startEl) {
            startEl.addEventListener('change', () => {
                DocModel.pageSettings.pageNumberStartFrom = parseInt(startEl.value) || 1;
            });
        }
    },

    setupColumnControls() {
        document.querySelectorAll('.column-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const cols = parseInt(btn.dataset.columns) || 1;
                DocModel.pageSettings.columns = cols;
                DocModel.saveState();

                // Update button states
                document.querySelectorAll('.column-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                Canvas.render();
                document.getElementById('status-text').textContent = `Layout: ${cols} column${cols > 1 ? 's' : ''}`;
            });
        });
    }
};

window.PageSettings = PageSettings;
