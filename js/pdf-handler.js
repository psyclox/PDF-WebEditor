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
                // Only alert once on first page
                if (docPage === DocModel.pages[0]) {
                    console.warn('No text found (Scanned PDF?)');
                    const statusBar = document.getElementById('status-text');
                    if (statusBar) statusBar.textContent = 'No text found (Scanned PDF). Use OCR tool.';
                }
                return;
            }

            const VISUAL_SCALE = 96 / 72;
            const viewportHeight = viewport.height; // Already at scale=1 usually? 
            // wait, in openPDF we did: const origViewport = pdfPage.getViewport({ scale: 1 });
            // and passed that as viewport. So viewport.height is PDF points.

            // Normalize all items
            let items = textContent.items.map(item => {
                const tx = item.transform;
                // PDF space (72dpi, bottom-left origin)
                const pdfFontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
                const pdfX = tx[4];
                const pdfY = tx[5];

                // HTML space (96dpi, top-left origin)
                const fontSizePx = Math.round(pdfFontSize * VISUAL_SCALE);
                const x = pdfX * VISUAL_SCALE;
                // Adjust Y to top-left. PDF Y is baseline. We need top.
                // Heuristic: top is roughly Y - fontSize (since Y is bottom-up 0 at bottom)
                // Actually: HTML_Y = (PageHeight - PDF_Y) * Scale - FontSizePx (approx)
                // Better: HTML_Y = (PageHeight - PDF_Y) * Scale - (fontSizePx * 0.8) for baseline adjustment
                const y = (viewportHeight - pdfY) * VISUAL_SCALE - (fontSizePx * 0.8);

                return {
                    text: item.str,
                    x: x,
                    y: y,
                    width: item.width * VISUAL_SCALE,
                    height: fontSizePx, // Approximation of line height
                    fontSize: fontSizePx,
                    fontName: item.fontName,
                    hasEOL: item.hasEOL
                };
            }).filter(i => i.text.trim().length > 0);

            // 1. Group into physical lines (based on Y overlap)
            // Sort by Y first
            items.sort((a, b) => a.y - b.y);

            const lines = [];
            if (items.length > 0) {
                let currentLine = [items[0]];
                let currentLineY = items[0].y;
                let currentLineH = items[0].height;

                for (let i = 1; i < items.length; i++) {
                    const item = items[i];
                    // If vertical overlap is significant, it's the same line
                    // Tolerance: half the font size
                    if (Math.abs(item.y - currentLineY) < (currentLineH * 0.5)) {
                        currentLine.push(item);
                    } else {
                        lines.push(currentLine);
                        currentLine = [item];
                        currentLineY = item.y;
                        currentLineH = item.height;
                    }
                }
                lines.push(currentLine);
            }

            // 2. Consolidate within lines (sort X, merge adjacent text)
            const solidLines = lines.map(lineItems => {
                lineItems.sort((a, b) => a.x - b.x);

                let text = '';
                let lastEnd = -1000;
                let startX = lineItems[0].x;
                let startY = lineItems[0].y; // Use first item Y as line Y
                let maxHeight = 0;
                let width = 0;

                lineItems.forEach(item => {
                    // Check gap
                    if (lastEnd > 0) {
                        const gap = item.x - lastEnd;
                        // If gap is large, maybe we should treat as separate checks?
                        // For now, simple merging:
                        if (gap > 5) text += ' '; // Add space for small visual gaps
                        if (gap > 100) text += '     '; // Tab simulation?
                    }
                    text += item.text;
                    lastEnd = item.x + item.width;
                    maxHeight = Math.max(maxHeight, item.height);
                });

                width = lastEnd - startX;

                return {
                    text: text,
                    x: startX,
                    y: startY,
                    width: width,
                    height: maxHeight,
                    fontSizePx: lineItems[0].fontSize // Use first item font
                };
            });

            // 2. Block Layout Engine (Professional Grouping)
            const pool = solidLines; // Define pool as alias for solidLines
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

                    // Gap must be positive and reasonable
                    // FIX: Ensure specific minimum gap to avoid crushing
                    if (verticalGap >= (block.fontSizePx * 0.1) && verticalGap < (block.fontSizePx * 2.5)) {
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

                // Safe fallbacks for Line Height
                if (block.lineHeightRatio < 1.0) block.lineHeightRatio = 1.1; // Force visual separation

                blocks.push(block);
            }

            // 3. Render Blocks
            blocks.forEach(b => {
                const combinedText = b.lines.join('<br>');

                // Dynamic geometric line height (clamped 1.1 - 2.0)
                let lh = Math.max(1.1, Math.min(b.lineHeightRatio, 2.0));
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

                // Use DocModel to add element (handles ID if missing, though we added it now)
                DocModel.addElement(DocModel.pages.indexOf(docPage), el);
            });

            console.log(`Smart Import: Created ${blocks.length} blocks from ${items.length} text fragments.`);

        } catch (e) {
            console.warn('Text processing error:', e);
        }
    }
};

window.PDFHandler = PDFHandler;
