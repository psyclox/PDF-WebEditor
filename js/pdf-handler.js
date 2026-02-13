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

            // Store original PDF buffer for high-quality export
            DocModel.pdfBuffer = arrayBuffer;

            // Fully reset document — clear pages, selection, history
            DocModel.pages = [];
            DocModel.selectedElements = [];
            DocModel.activePageIndex = 0;
            DocModel.history = [];
            DocModel.historyIndex = -1;

            const numPages = this.pdfDoc.numPages;

            for (let i = 1; i <= numPages; i++) {
                if (statusBar) statusBar.textContent = `Rendering page ${i} of ${numPages}...`;
                const pdfPage = await this.pdfDoc.getPage(i);

                // Render at 2x scale for crisp output
                const scale = 2;
                const viewport = pdfPage.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await pdfPage.render({ canvasContext: ctx, viewport }).promise;

                // Convert PDF points (72dpi) to screen pixels (96dpi)
                const origViewport = pdfPage.getViewport({ scale: 1 });
                const pageWidth = Math.round(origViewport.width * (96 / 72));
                const pageHeight = Math.round(origViewport.height * (96 / 72));

                // Set document page dimensions on first page
                if (i === 1) {
                    DocModel.pageSettings.width = pageWidth;
                    DocModel.pageSettings.height = pageHeight;
                    DocModel.pageSettings.marginTop = 0;
                    DocModel.pageSettings.marginBottom = 0;
                    DocModel.pageSettings.marginLeft = 0;
                    DocModel.pageSettings.marginRight = 0;
                }

                // Create a fresh page
                const docPage = DocModel.createPage();

                // Add the rendered PDF page as a single locked background image
                // NO text overlays — they misalign and create duplicate text
                const imgEl = Elements.createImage(0, 0, canvas.toDataURL('image/jpeg', 0.92), pageWidth, pageHeight);
                imgEl.id = 'pdf-bg-' + i;
                imgEl.objectFit = 'fill';
                imgEl.locked = true;
                imgEl.isPdfBackground = true; // Tag for export
                imgEl.pdfPageIndex = i - 1;   // 0-based index
                imgEl.zIndex = 0;
                imgEl.visible = true;
                imgEl.opacity = 1;
                imgEl.rotation = 0;
                imgEl.borderWidth = 0;
                imgEl.borderColor = 'transparent';
                docPage.elements.push(imgEl);

                DocModel.pages.push(docPage);

                // Smart Text Import: Extract text, create editable textboxes
                await this.processTextLayer(pdfPage, docPage, origViewport);
            }

            DocModel.saveState();
            Canvas.render();

            if (statusBar) statusBar.textContent = `Opened ${file.name} — ${numPages} page${numPages > 1 ? 's' : ''}`;
            App.updatePageInfo();

        } catch (err) {
            console.error('PDF open error:', err);
            if (statusBar) statusBar.textContent = 'Error opening PDF: ' + err.message;
            alert('Error opening PDF: ' + err.message);
        }
    },

    async processTextLayer(pdfPage, docPage, viewport) {
        try {
            const textContent = await pdfPage.getTextContent();

            if (!textContent || textContent.items.length === 0) {
                console.warn('No text content found on page (Scanned PDF?)');
                const statusBar = document.getElementById('status-text');
                if (statusBar) statusBar.textContent = 'No text found (Scanned PDF). Use OCR tool.';
                // Only alert once on first page to avoid spam
                if (docPage === DocModel.pages[0]) {
                    alert('No text found in this PDF. It appears to be a scanned image.\n\nPlease use the "Run OCR" tool to edit text.');
                }
                return;
            }

            const scale = 96 / 72;
            const pageHeight = viewport.height;

            // Group items by line (approximately same Y)
            const lines = {};
            textContent.items.forEach(item => {
                // Round Y to group items on same line
                const y = Math.round(item.transform[5]);
                if (!lines[y]) lines[y] = [];
                lines[y].push(item);
            });

            // Process each line
            Object.keys(lines).forEach(yKey => {
                // Sort by X coordinate
                const items = lines[yKey].sort((a, b) => a.transform[4] - b.transform[4]);

                // Construct text with spacing
                let textArr = [];
                let prevEnd = -1;

                items.forEach(item => {
                    // If gap > 3 points, add space
                    if (prevEnd !== -1 && (item.transform[4] - prevEnd > 4)) {
                        textArr.push(' ');
                    }
                    textArr.push(item.str);
                    prevEnd = item.transform[4] + item.width;
                });

                const text = textArr.join('');
                if (!text.trim()) return;

                const first = items[0];
                const last = items[items.length - 1];

                // Calculate position and size in pixels
                const fontSizePt = (first.height || 12);
                const fontSizePx = Math.max(10, Math.ceil(fontSizePt * scale)); // Use Ceil for better fit

                const x = Math.round(first.transform[4] * scale);
                // Improved Top calculation: Align baseline better
                // PDF Y is bottom-left. HTML Y is top-left.
                const y = Math.round((pageHeight - first.transform[5] - fontSizePt * 0.75) * scale);

                const width = Math.round(((last.transform[4] + last.width) - first.transform[4]) * scale) + 20; // Extra width buffer

                // Height needs to accommodate descenders and line-height
                const height = fontSizePx * 1.5;

                const el = Elements.createTextBox(x, y, width, height, text);
                el.content = `<p>${text}</p>`;
                el.fontSize = fontSizePx;
                el.fontFamily = 'Inter'; // Default font
                el.backgroundColor = '#ffffff'; // OPAQUE WHITE to cover original text
                el.padding = 4; // Padding to prevent text touching edges
                el.locked = false; // Editable!
                el.borderWidth = 0; // No border by default
                el.borderColor = 'transparent';
                el.zIndex = 10; // Ensure it's above background

                docPage.elements.push(el);
            });

            console.log(`Imported ${Object.keys(lines).length} lines of text.`);
            const statusBar = document.getElementById('status-text');
            if (statusBar && Object.keys(lines).length > 0) {
                statusBar.textContent = `Smart Import: ${Object.keys(lines).length} lines editable.`;
            }

        } catch (e) {
            console.warn('Text layer processing failed:', e);
            alert('Smart Import Error: ' + e.message);
        }
    }
};

window.PDFHandler = PDFHandler;
