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

            // 1. Collect all lines first
            const pool = [];
            const sortedYKeys = Object.keys(lines).sort((a, b) => parseFloat(b) - parseFloat(a));

            sortedYKeys.forEach(yKey => {
                const items = lines[yKey].sort((a, b) => a.transform[4] - b.transform[4]);

                // Construct text line
                let textArr = [];
                let prevEnd = -1;
                items.forEach(item => {
                    if (prevEnd !== -1 && (item.transform[4] - prevEnd > 4)) textArr.push(' ');
                    textArr.push(item.str);
                    prevEnd = item.transform[4] + item.width;
                });
                const text = textArr.join('').trim();
                if (!text) return;

                const first = items[0];
                const last = items[items.length - 1];
                const fontSizePt = (first.height || 12);
                const fontSizePx = Math.max(10, Math.floor(fontSizePt * scale));
                const x = Math.round(first.transform[4] * scale);
                // HTML Top Y
                const y = Math.round((pageHeight - first.transform[5] - fontSizePt * 0.80) * scale);
                const width = Math.round(((last.transform[4] + last.width) - first.transform[4]) * scale) + 16;
                const height = fontSizePx; // Initial line height estimate

                pool.push({ text, x, y, width, fontSizePx, height });
            });

            // 2. Block Layout Engine (Professional Grouping)
            const blocks = [];
            const processed = new Set();

            // Sort pool top-down, left-right
            pool.sort((a, b) => (a.y - b.y) || (a.x - b.x));

            for (let i = 0; i < pool.length; i++) {
                if (processed.has(i)) continue;

                // Start new Block
                const root = pool[i];
                const block = {
                    lines: [root.text],
                    x: root.x,
                    y: root.y,
                    width: root.width,
                    fontSizePx: root.fontSizePx,
                    lastY: root.y,
                    gaps: []
                };
                processed.add(i);

                // Find successors
                let current = root;
                for (let j = i + 1; j < pool.length; j++) {
                    if (processed.has(j)) continue;

                    const candidate = pool[j];

                    // Matching Heuristics
                    if (candidate.fontSizePx !== block.fontSizePx) continue;
                    if (Math.abs(candidate.x - block.x) > 20) continue; // Strict Column Align

                    const verticalGap = candidate.y - current.y;

                    // Gap must be positive and reasonable (< 2.5 font size)
                    if (verticalGap > 0 && verticalGap < (block.fontSizePx * 2.5)) {
                        block.lines.push(candidate.text);
                        block.width = Math.max(block.width, candidate.width);
                        block.gaps.push(verticalGap);

                        block.lastY = candidate.y;
                        current = candidate;
                        processed.add(j);
                    }
                }

                // Calculate Dynamic Line Height
                if (block.gaps.length > 0) {
                    const avgGap = block.gaps.reduce((a, b) => a + b, 0) / block.gaps.length;
                    block.lineHeightRatio = avgGap / block.fontSizePx;
                } else {
                    block.lineHeightRatio = 1.2;
                }
                blocks.push(block);
            }

            // 3. Render Blocks
            blocks.forEach(b => {
                const combinedText = b.lines.join('<br>');

                // Dynamic geometric line height (clamped 1.0 - 2.0)
                let lh = Math.max(1.0, Math.min(b.lineHeightRatio, 2.0));
                lh = Math.round(lh * 100) / 100;

                const padding = 2;

                // Height = Lines * (FontSize * LH) + Padding*2
                const totalHeight = Math.round((b.lines.length * (b.fontSizePx * lh)) + (padding * 2));

                const finalY = b.y - padding;

                const el = Elements.createTextBox(b.x - padding, finalY, b.width + (padding * 3), totalHeight, combinedText);
                // Add pointer-events: none to ensure clicks pass through to the draggable wrapper
                el.content = `<p style="margin:0; line-height: ${lh}; pointer-events: none;">${combinedText}</p>`;
                el.fontSize = b.fontSizePx;
                el.fontFamily = 'Inter';
                el.backgroundColor = '#ffffff'; // Opaque
                el.padding = padding;
                el.locked = false;
                el.borderWidth = 0;
                el.borderColor = 'transparent';
                el.zIndex = 20;

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
