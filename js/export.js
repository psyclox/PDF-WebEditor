// export.js — Export PDF, PNG, DOCX
const ExportManager = {
    async exportPDF() {
        const statusBar = document.getElementById('status-text');
        if (statusBar) statusBar.textContent = 'Exporting PDF...';

        try {
            const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
            let pdfDoc;
            let srcDoc = null;

            // Try to load original PDF for "Proper Export" (Vector preservation)
            if (DocModel.pdfBuffer) {
                try {
                    srcDoc = await PDFDocument.load(DocModel.pdfBuffer);
                    pdfDoc = await PDFDocument.create();
                } catch (e) {
                    console.warn('Failed to load original PDF buffer, falling back to raster export', e);
                    pdfDoc = await PDFDocument.create();
                }
            } else {
                pdfDoc = await PDFDocument.create();
            }

            const ps = DocModel.pageSettings;

            for (let i = 0; i < DocModel.pages.length; i++) {
                const page = DocModel.pages[i];
                let pdfPage;

                // Check if this page has a PDF background
                const bgEl = page.elements.find(el => el.isPdfBackground);

                if (srcDoc && bgEl && typeof bgEl.pdfPageIndex === 'number') {
                    // Copy original vector page
                    const [copiedPage] = await pdfDoc.copyPages(srcDoc, [bgEl.pdfPageIndex]);
                    pdfPage = pdfDoc.addPage(copiedPage);
                } else {
                    // Create new blank page
                    pdfPage = pdfDoc.addPage([ps.width * 0.75, ps.height * 0.75]);

                    // If it has a background color, draw it? (Optional, default white)
                }

                const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

                for (const el of sorted) {
                    if (!el.visible) continue;

                    // Skip the background image if we used the vector page!
                    if (el.isPdfBackground && srcDoc) continue;

                    try {
                        if (el.type === 'textbox') {
                            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                            const tmp = document.createElement('div');
                            tmp.innerHTML = el.content;
                            const text = tmp.textContent || tmp.innerText || '';
                            const lines = text.split('\n');
                            let yOffset = 0;

                            lines.forEach(line => {
                                if (line.trim()) {
                                    const hex = el.color || '#000000';
                                    const r = parseInt(hex.slice(1, 3), 16) / 255;
                                    const g = parseInt(hex.slice(3, 5), 16) / 255;
                                    const b = parseInt(hex.slice(5, 7), 16) / 255;

                                    pdfPage.drawText(line, {
                                        x: el.x * 0.75,
                                        y: (ps.height - el.y - yOffset - el.fontSize) * 0.75,
                                        size: (el.fontSize || 12) * 0.75,
                                        font: font,
                                        color: rgb(r, g, b),
                                        opacity: el.opacity || 1
                                    });
                                }
                                yOffset += (el.fontSize || 14) * (el.lineHeight || 1.5);
                            });

                        } else if (el.type === 'image' && el.src) {
                            let imgData;
                            const src = el.src;
                            if (src.startsWith('data:image/png')) {
                                imgData = await pdfDoc.embedPng(src);
                            } else if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
                                imgData = await pdfDoc.embedJpg(src);
                            } else {
                                try {
                                    imgData = await pdfDoc.embedPng(src);
                                } catch {
                                    imgData = await pdfDoc.embedJpg(src);
                                }
                            }
                            if (imgData) {
                                pdfPage.drawImage(imgData, {
                                    x: el.x * 0.75,
                                    y: (ps.height - el.y - el.height) * 0.75,
                                    width: el.width * 0.75,
                                    height: el.height * 0.75,
                                    opacity: el.opacity || 1
                                });
                            }

                        } else if (el.type === 'shape') {
                            const hex = el.fill || '#4a90d9';
                            const r = parseInt(hex.slice(1, 3), 16) / 255;
                            const g = parseInt(hex.slice(3, 5), 16) / 255;
                            const b = parseInt(hex.slice(5, 7), 16) / 255;

                            if (el.shapeType === 'rectangle') {
                                pdfPage.drawRectangle({
                                    x: el.x * 0.75,
                                    y: (ps.height - el.y - el.height) * 0.75,
                                    width: el.width * 0.75,
                                    height: el.height * 0.75,
                                    color: rgb(r, g, b),
                                    opacity: el.opacity || 1
                                });
                            } else if (el.shapeType === 'circle') {
                                pdfPage.drawEllipse({
                                    x: (el.x + el.width / 2) * 0.75,
                                    y: (ps.height - el.y - el.height / 2) * 0.75,
                                    xScale: el.width / 2 * 0.75,
                                    yScale: el.height / 2 * 0.75,
                                    color: rgb(r, g, b),
                                    opacity: el.opacity || 1
                                });
                            } else if (el.shapeType === 'line') {
                                const sh = el.stroke || '#2c5f8a';
                                const sr = parseInt(sh.slice(1, 3), 16) / 255;
                                const sg = parseInt(sh.slice(3, 5), 16) / 255;
                                const sb = parseInt(sh.slice(5, 7), 16) / 255;
                                pdfPage.drawLine({
                                    start: { x: el.x * 0.75, y: (ps.height - el.y - el.height / 2) * 0.75 },
                                    end: { x: (el.x + el.width) * 0.75, y: (ps.height - el.y - el.height / 2) * 0.75 },
                                    color: rgb(sr, sg, sb),
                                    thickness: el.strokeWidth || 2
                                });
                            }

                        } else if (el.type === 'watermark') {
                            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                            pdfPage.drawText(el.text || 'WATERMARK', {
                                x: ps.width * 0.15 * 0.75,
                                y: ps.height * 0.5 * 0.75,
                                size: (el.fontSize || 72) * 0.75,
                                font: font,
                                color: rgb(0.8, 0.8, 0.8),
                                opacity: el.opacity || 0.15,
                                rotate: { type: 'degrees', angle: el.rotation || -45 }
                            });
                        }
                    } catch (elErr) {
                        console.warn('Could not export element:', el.type, elErr);
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            this.download(blob, 'pro_edited_document.pdf');
            if (statusBar) statusBar.textContent = 'PDF exported successfully (Vector Mode)';
        } catch (err) {
            console.error('PDF export error:', err);
            if (statusBar) statusBar.textContent = 'Error exporting PDF: ' + err.message;
            alert('Error exporting PDF: ' + err.message);
        }
    },

    async exportPNG() {
        const statusBar = document.getElementById('status-text');
        if (statusBar) statusBar.textContent = 'Exporting PNG...';

        try {
            const pages = document.querySelectorAll('.page');
            if (pages.length === 0) {
                alert('No pages to export');
                return;
            }

            // Export each page
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i];
                // Temporarily remove selection highlights
                pageEl.querySelectorAll('.element-wrapper.selected').forEach(w => w.classList.remove('selected'));
                pageEl.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'none');

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    backgroundColor: pageEl.style.backgroundColor || '#ffffff',
                    useCORS: true,
                    allowTaint: true
                });

                canvas.toBlob((blob) => {
                    const suffix = pages.length > 1 ? `_page${i + 1}` : '';
                    this.download(blob, `document${suffix}.png`);
                }, 'image/png');
            }

            Canvas.render(); // Re-render to restore selection
            if (statusBar) statusBar.textContent = 'PNG exported successfully';
        } catch (err) {
            console.error('PNG export error:', err);
            if (statusBar) statusBar.textContent = 'Error exporting PNG';
            alert('Error exporting PNG: ' + err.message);
        }
    },

    async exportDOCX() {
        const statusBar = document.getElementById('status-text');
        if (statusBar) statusBar.textContent = 'Exporting DOCX...';

        try {
            const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
                AlignmentType, HeadingLevel, BorderStyle, WidthType } = docx;

            const sections = [];
            const ps = DocModel.pageSettings;

            for (const page of DocModel.pages) {
                const children = [];
                const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

                for (const el of sorted) {
                    if (!el.visible) continue;

                    if (el.type === 'textbox') {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = el.content;
                        const text = tmp.textContent || '';
                        const lines = text.split('\n');

                        lines.forEach(line => {
                            if (!line.trim()) return;
                            const alignment = {
                                'left': AlignmentType.LEFT,
                                'center': AlignmentType.CENTER,
                                'right': AlignmentType.RIGHT,
                                'justify': AlignmentType.JUSTIFIED
                            }[el.textAlign] || AlignmentType.LEFT;

                            let heading;
                            if (el.fontSize >= 28) heading = HeadingLevel.HEADING_1;
                            else if (el.fontSize >= 22) heading = HeadingLevel.HEADING_2;
                            else if (el.fontSize >= 18) heading = HeadingLevel.HEADING_3;

                            children.push(new Paragraph({
                                alignment,
                                heading,
                                spacing: { line: Math.round((el.lineHeight || 1.5) * 240) },
                                children: [
                                    new TextRun({
                                        text: line,
                                        font: el.fontFamily || 'Calibri',
                                        size: (el.fontSize || 12) * 2,
                                        bold: el.fontWeight === 'bold',
                                        italics: el.fontStyle === 'italic',
                                        underline: el.textDecoration === 'underline' ? {} : undefined,
                                        color: (el.color || '#000000').replace('#', '')
                                    })
                                ]
                            }));
                        });

                    } else if (el.type === 'image' && el.src?.startsWith('data:')) {
                        try {
                            const base64 = el.src.split(',')[1];
                            const imgType = el.src.includes('png') ? 'png' : 'jpeg';
                            children.push(new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
                                        transformation: {
                                            width: Math.min(el.width, 600),
                                            height: Math.min(el.height, 800)
                                        },
                                        type: imgType
                                    })
                                ]
                            }));
                        } catch (imgErr) {
                            console.warn('Could not embed image in DOCX:', imgErr);
                        }

                    } else if (el.type === 'table') {
                        const rows = [];
                        for (let r = 0; r < el.rows; r++) {
                            const cells = [];
                            for (let c = 0; c < el.cols; c++) {
                                const cell = el.cells[r]?.[c];
                                cells.push(new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({
                                            text: cell?.content || '',
                                            font: cell?.fontFamily || 'Calibri',
                                            size: (cell?.fontSize || 12) * 2,
                                            bold: cell?.fontWeight === 'bold'
                                        })]
                                    })],
                                    width: { size: Math.round(el.cellWidth * 15), type: WidthType.DXA }
                                }));
                            }
                            rows.push(new TableRow({ children: cells }));
                        }
                        children.push(new Table({
                            rows: rows,
                            width: { size: 100, type: WidthType.PERCENTAGE }
                        }));
                    }
                }

                if (children.length === 0) {
                    children.push(new Paragraph({ children: [new TextRun('')] }));
                }

                sections.push({
                    properties: {
                        page: {
                            size: { width: ps.width * 15, height: ps.height * 15 },
                            margin: {
                                top: ps.marginTop * 15,
                                bottom: ps.marginBottom * 15,
                                left: ps.marginLeft * 15,
                                right: ps.marginRight * 15
                            }
                        }
                    },
                    children
                });
            }

            const doc = new Document({ sections });
            const buffer = await Packer.toBlob(doc);
            this.download(buffer, 'document.docx');
            if (statusBar) statusBar.textContent = 'DOCX exported successfully';
        } catch (err) {
            console.error('DOCX export error:', err);
            if (statusBar) statusBar.textContent = 'Error exporting DOCX: ' + err.message;
            alert('Error exporting DOCX: ' + err.message);
        }
    },

    download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
};

window.ExportManager = ExportManager;
