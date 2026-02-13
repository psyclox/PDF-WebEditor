// elements.js — Element creation factories & manipulation
const Elements = {
    createTextBox(x, y, width, height, content) {
        return {
            type: 'textbox',
            id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            width: width || 300, height: height || 100,
            content: content || '<p>Type your text here...</p>',
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0,
            wordSpacing: 0,
            color: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 8,
            opacity: 1,
            rotation: 0
        };
    },

    createImage(x, y, src, width, height) {
        return {
            type: 'image',
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            width: width || 300, height: height || 200,
            src: src || '',
            objectFit: 'contain',
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            opacity: 1,
            rotation: 0,
            borderRadius: 0,
            borderColor: 'transparent',
            borderWidth: 0,
            cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0,
            isCropping: false
        };
    },

    createShape(x, y, shapeType, width, height) {
        return {
            type: 'shape',
            shapeType: shapeType || 'rectangle',
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            width: width || 150, height: height || 100,
            fill: '#4a90d9',
            stroke: '#2c5f8a',
            strokeWidth: 2,
            opacity: 1,
            rotation: 0,
            borderRadius: 0
        };
    },

    createTable(x, y, rows, cols) {
        rows = rows || 3;
        cols = cols || 3;
        const cells = [];
        for (let r = 0; r < rows; r++) {
            cells[r] = [];
            for (let c = 0; c < cols; c++) {
                cells[r][c] = {
                    content: '',
                    bgColor: r === 0 ? '#e8eef4' : '#ffffff',
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: r === 0 ? 'bold' : 'normal',
                    color: '#000000',
                    textAlign: 'left',
                    verticalAlign: 'middle',
                    borderColor: '#bdc3c7',
                    borderWidth: 1,
                    padding: 6,
                    colSpan: 1,
                    rowSpan: 1
                };
            }
        }
        return {
            type: 'table',
            x: x || 100, y: y || 100,
            width: cols * 120,
            height: rows * 36,
            rows: rows,
            cols: cols,
            cells: cells,
            cellWidth: 120,
            cellHeight: 36,
            borderColor: '#bdc3c7',
            borderWidth: 1,
            opacity: 1,
            rotation: 0
        };
    },

    createWatermark(text, options) {
        return {
            type: 'watermark',
            x: 0, y: 0,
            width: DocModel.pageSettings.width,
            height: DocModel.pageSettings.height,
            text: text || 'CONFIDENTIAL',
            fontFamily: options?.fontFamily || 'Inter',
            fontSize: options?.fontSize || 72,
            color: options?.color || 'rgba(200,200,200,0.3)',
            rotation: options?.rotation || -45,
            opacity: options?.opacity || 0.3,
            isWatermark: true,
            locked: true,
            subType: options?.subType || 'text',
            imageSrc: options?.imageSrc || null,
            blur: options?.blur || 0
        };
    },

    createSignature(x, y) {
        return {
            type: 'signature',
            x: x || 100, y: y || 600,
            width: 250, height: 80,
            dataUrl: '',
            signatureType: 'draw', // draw, type, upload
            text: '',
            fontFamily: 'Dancing Script',
            fontSize: 32,
            color: '#000080',
            borderBottom: '2px solid #333',
            opacity: 1,
            rotation: 0
        };
    },

    createPageNumber(position, format) {
        return {
            type: 'pageNumber',
            position: position || 'bottom-center',
            format: format || 'decimal',
            fontFamily: 'Inter',
            fontSize: 11,
            color: '#666666',
            prefix: '',
            suffix: '',
            startFrom: 1,
            showOnFirstPage: true
        };
    },

    createComment(x, y, text) {
        return {
            type: 'comment',
            x: x || 700, y: y || 100,
            width: 200, height: 120,
            text: text || '',
            author: 'User',
            date: new Date().toISOString(),
            color: '#fff9c4',
            resolved: false,
            opacity: 1,
            rotation: 0
        };
    },

    createLink(x, y, text, url) {
        return {
            type: 'link',
            x: x || 100, y: y || 100,
            width: 200, height: 30,
            text: text || 'Click here',
            url: url || 'https://',
            fontFamily: 'Inter',
            fontSize: 14,
            color: '#1a73e8',
            textDecoration: 'underline',
            opacity: 1,
            rotation: 0
        };
    },

    createHeaderFooter(type, content) {
        return {
            type: type === 'header' ? 'header' : 'footer',
            content: content || '',
            fontFamily: 'Inter',
            fontSize: 10,
            color: '#888888',
            textAlign: 'center',
            includePageNumber: false,
            includeDatetime: false,
            borderBottom: type === 'header' ? '1px solid #ddd' : 'none',
            borderTop: type === 'footer' ? '1px solid #ddd' : 'none'
        };
    }
};

window.Elements = Elements;
