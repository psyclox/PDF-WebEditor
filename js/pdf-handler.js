// pdf-handler.js — PDF.js integration for opening and importing PDFs
const PDFHandler = {
    pdfDoc: null,

    async openPDF(file) {
        const statusBar = document.getElementById('status-text');
        if (statusBar) statusBar.textContent = 'Opening PDF...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            this.pdfDoc = await loadingTask.promise;

            DocModel.pages = [];
            const numPages = this.pdfDoc.numPages;

            for (let i = 1; i <= numPages; i++) {
                if (statusBar) statusBar.textContent = `Processing page ${i} of ${numPages}...`;
                const page = await this.pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });

                // Render page to canvas
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;

                // Create page in model
                const docPage = DocModel.createPage();

                // Add rendered page as image
                const imgEl = Elements.createImage(0, 0, canvas.toDataURL('image/png'), viewport.width, viewport.height);
                imgEl.locked = true;
                imgEl.zIndex = 0;
                imgEl.id = 'el-bg-' + i;
                docPage.elements.push(imgEl);

                // Extract text content
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => {
                    if (item.str.trim()) {
                        const tx = item.transform;
                        const textEl = Elements.createTextBox(
                            tx[4],
                            viewport.height - tx[5] - item.height,
                            item.width * 1.5 + 20,
                            (item.height || 14) * 1.8
                        );
                        textEl.content = `<p>${item.str}</p>`;
                        textEl.fontSize = Math.round(item.height || 12);
                        textEl.fontFamily = item.fontName?.includes('Bold') ? 'Inter' : 'Inter';
                        textEl.fontWeight = item.fontName?.includes('Bold') ? 'bold' : 'normal';
                        textEl.backgroundColor = 'transparent';
                        textEl.id = 'el-text-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
                        docPage.elements.push(textEl);
                    }
                });

                // Update page settings to match PDF
                if (i === 1) {
                    DocModel.pageSettings.width = Math.round(viewport.width);
                    DocModel.pageSettings.height = Math.round(viewport.height);
                }

                DocModel.pages.push(docPage);
            }

            DocModel.activePageIndex = 0;
            DocModel.history = [];
            DocModel.historyIndex = -1;
            DocModel.saveState();
            Canvas.render();

            if (statusBar) statusBar.textContent = `Opened ${file.name} — ${numPages} pages`;
        } catch (err) {
            console.error('PDF open error:', err);
            if (statusBar) statusBar.textContent = 'Error opening PDF: ' + err.message;
            alert('Error opening PDF: ' + err.message);
        }
    }
};

window.PDFHandler = PDFHandler;
