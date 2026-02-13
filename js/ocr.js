// ocr.js — Tesseract.js OCR integration
const OCRManager = {
    isRunning: false,

    async runOCR() {
        if (this.isRunning) return;
        this.isRunning = true;

        const statusBar = document.getElementById('status-text');
        const progressBar = document.getElementById('ocr-progress');
        const progressFill = document.getElementById('ocr-progress-fill');

        if (statusBar) statusBar.textContent = 'Starting OCR...';
        if (progressBar) progressBar.classList.add('show');

        try {
            const page = DocModel.getActivePage();
            // Find image elements on the page to OCR
            const images = page.elements.filter(el => el.type === 'image');

            if (images.length === 0) {
                alert('No images found on the current page to perform OCR on.');
                this.isRunning = false;
                if (statusBar) statusBar.textContent = 'Ready';
                if (progressBar) progressBar.classList.remove('show');
                return;
            }

            const worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text' && progressFill) {
                        progressFill.style.width = Math.round(m.progress * 100) + '%';
                    }
                    if (statusBar) statusBar.textContent = `OCR: ${m.status} (${Math.round((m.progress || 0) * 100)}%)`;
                }
            });

            for (const img of images) {
                if (!img.src) continue;
                if (statusBar) statusBar.textContent = 'Recognizing text...';

                const { data } = await worker.recognize(img.src);

                if (data.text.trim()) {
                    // Create text elements for each block
                    data.blocks?.forEach(block => {
                        if (!block.text.trim()) return;
                        const textEl = Elements.createTextBox(
                            img.x + (block.bbox.x0 * img.width / data.imageWidth),
                            img.y + (block.bbox.y0 * img.height / data.imageHeight),
                            (block.bbox.x1 - block.bbox.x0) * img.width / data.imageWidth,
                            (block.bbox.y1 - block.bbox.y0) * img.height / data.imageHeight
                        );
                        textEl.content = `<p>${block.text.replace(/\n/g, '<br>')}</p>`;
                        textEl.fontSize = Math.max(10, Math.round(block.paragraphs?.[0]?.lines?.[0]?.words?.[0]?.font_size || 14));
                        textEl.backgroundColor = 'rgba(255,255,200,0.5)';
                        DocModel.addElement(DocModel.activePageIndex, textEl);
                    });
                }
            }

            await worker.terminate();
            Canvas.render();
            if (statusBar) statusBar.textContent = 'OCR completed successfully';
            if (progressBar) progressBar.classList.remove('show');
        } catch (err) {
            console.error('OCR Error:', err);
            if (statusBar) statusBar.textContent = 'OCR Error: ' + err.message;
            alert('OCR Error: ' + err.message);
        }

        this.isRunning = false;
    }
};

window.OCRManager = OCRManager;
