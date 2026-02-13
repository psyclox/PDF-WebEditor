// document.js — Document model, page management, element CRUD, undo/redo
const DocModel = {
    pages: [],
    activePageIndex: 0,
    selectedElements: [],
    groups: {},       // Group ID -> array of element IDs
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    pageSettings: {
        width: 816,   // 8.5in at 96dpi
        height: 1056, // 11in at 96dpi
        marginTop: 96,
        marginBottom: 96,
        marginLeft: 96,
        marginRight: 96,
        orientation: 'portrait',
        size: 'letter',
        pageNumberStyle: 'none',
        pageNumberPosition: 'bottom-center',
        pageNumberFormat: 'decimal',
        pageNumberStartFrom: 1,
        headerContent: '',
        footerContent: '',
        backgroundColor: '#ffffff',
        columns: 1
    },

    init() {
        this.pages = [];
        this.selectedElements = [];
        this.groups = {};
        this.history = [];
        this.historyIndex = -1;
        this.addPage();
        this.saveState();
    },

    createPage() {
        return {
            id: 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            elements: [],
            backgroundColor: this.pageSettings.backgroundColor
        };
    },

    addPage(index) {
        const page = this.createPage();
        if (index !== undefined) {
            this.pages.splice(index + 1, 0, page);
        } else {
            this.pages.push(page);
        }
        this.activePageIndex = index !== undefined ? index + 1 : this.pages.length - 1;
        this.saveState();
        return page;
    },

    deletePage(index) {
        if (this.pages.length <= 1) return false;

        this.pages.splice(index, 1);
        if (this.activePageIndex >= this.pages.length) {
            this.activePageIndex = this.pages.length - 1;
        }
        this.saveState();
        return true;
    },

    movePage(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.pages.length) return false;

        const page = this.pages[index];
        this.pages.splice(index, 1);
        this.pages.splice(newIndex, 0, page);

        this.activePageIndex = newIndex;
        this.saveState();
        return true;
    },


    getActivePage() {
        return this.pages[this.activePageIndex] || this.pages[0];
    },

    addElement(pageIndex, element) {
        const page = this.pages[pageIndex] || this.getActivePage();
        // Generate ID only if one isn't already set
        if (!element.id) {
            element.id = 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        // Set defaults only if not already set
        if (element.zIndex === undefined) element.zIndex = page.elements.length;
        if (element.locked === undefined) element.locked = false;
        if (element.visible === undefined) element.visible = true;
        if (element.opacity === undefined) element.opacity = 1;
        if (element.rotation === undefined) element.rotation = 0;
        page.elements.push(element);
        this.saveState();
        return element;
    },

    removeElement(pageIndex, elementId) {
        const page = this.pages[pageIndex] || this.getActivePage();
        page.elements = page.elements.filter(el => el.id !== elementId);
        // Also remove from any groups
        for (const gid in this.groups) {
            this.groups[gid] = this.groups[gid].filter(id => id !== elementId);
            if (this.groups[gid].length === 0) delete this.groups[gid];
        }
        this.saveState();
    },

    updateElement(pageIndex, elementId, props) {
        let el;
        if (pageIndex !== null && pageIndex !== undefined) {
            const page = this.pages[pageIndex] || this.getActivePage();
            el = page.elements.find(e => e.id === elementId);
        } else {
            // Search all pages
            for (const pg of this.pages) {
                el = pg.elements.find(e => e.id === elementId);
                if (el) break;
            }
        }
        if (el) Object.assign(el, props);
        return el;
    },

    getElement(pageIndex, elementId) {
        const page = this.pages[pageIndex] || this.getActivePage();
        return page.elements.find(e => e.id === elementId);
    },

    reorderElement(pageIndex, elementId, newZIndex) {
        const page = this.pages[pageIndex] || this.getActivePage();
        const el = page.elements.find(e => e.id === elementId);
        if (el) {
            el.zIndex = newZIndex;
            page.elements.sort((a, b) => a.zIndex - b.zIndex);
            page.elements.forEach((e, i) => e.zIndex = i);
            this.saveState();
        }
    },

    bringToFront(pageIndex, elementId) {
        const page = this.pages[pageIndex] || this.getActivePage();
        const maxZ = Math.max(...page.elements.map(e => e.zIndex || 0));
        this.reorderElement(pageIndex, elementId, maxZ + 1);
    },

    sendToBack(pageIndex, elementId) {
        this.reorderElement(pageIndex, elementId, -1);
        const page = this.pages[pageIndex] || this.getActivePage();
        page.elements.forEach((e, i) => e.zIndex = i);
    },

    duplicateElement(pageIndex, elementId) {
        const page = this.pages[pageIndex] || this.getActivePage();
        const el = page.elements.find(e => e.id === elementId);
        if (el) {
            const clone = JSON.parse(JSON.stringify(el));
            clone.id = null; // Force new ID
            clone.x += 20;
            clone.y += 20;
            return this.addElement(pageIndex, clone);
        }
    },

    // ===== GROUPING =====
    groupElements(elementIds) {
        if (elementIds.length < 2) return null;
        const groupId = 'group-' + Date.now();
        this.groups[groupId] = [...elementIds];
        // Tag each element with the group
        elementIds.forEach(id => {
            const el = this.getElement(this.activePageIndex, id);
            if (el) el.groupId = groupId;
        });
        this.saveState();
        return groupId;
    },

    ungroupElements(groupId) {
        if (!this.groups[groupId]) return;
        this.groups[groupId].forEach(id => {
            const el = this.getElement(this.activePageIndex, id);
            if (el) delete el.groupId;
        });
        delete this.groups[groupId];
        this.saveState();
    },

    getGroupMembers(groupId) {
        return this.groups[groupId] || [];
    },

    // Select all members of the group an element belongs to
    selectGroup(elementId) {
        const el = this.getElement(this.activePageIndex, elementId);
        if (el && el.groupId && this.groups[el.groupId]) {
            return [...this.groups[el.groupId]];
        }
        return [elementId];
    },

    saveState() {
        const state = JSON.parse(JSON.stringify({
            pages: this.pages,
            pageSettings: this.pageSettings,
            groups: this.groups
        }));
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
    },

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.pages = state.pages;
            this.pageSettings = state.pageSettings;
            this.groups = state.groups || {};
            return true;
        }
        return false;
    },

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.pages = state.pages;
            this.pageSettings = state.pageSettings;
            this.groups = state.groups || {};
            return true;
        }
        return false;
    },

    serialize() {
        return JSON.stringify({
            pages: this.pages,
            pageSettings: this.pageSettings,
            groups: this.groups,
            version: '1.1.0'
        });
    },

    deserialize(json) {
        try {
            const data = JSON.parse(json);
            this.pages = data.pages || [];
            this.pageSettings = { ...this.pageSettings, ...data.pageSettings };
            this.groups = data.groups || {};
            this.activePageIndex = 0;
            this.selectedElements = [];
            this.history = [];
            this.historyIndex = -1;
            this.saveState();
            return true;
        } catch (e) {
            console.error('Failed to deserialize:', e);
            return false;
        }
    },

    // Margin presets
    marginPresets: {
        normal: { top: 96, bottom: 96, left: 96, right: 96 },
        narrow: { top: 48, bottom: 48, left: 48, right: 48 },
        moderate: { top: 96, bottom: 96, left: 72, right: 72 },
        wide: { top: 96, bottom: 96, left: 192, right: 192 },
        mirrored: { top: 96, bottom: 96, left: 120, right: 96 }
    },

    setMarginPreset(preset) {
        const m = this.marginPresets[preset];
        if (m) {
            this.pageSettings.marginTop = m.top;
            this.pageSettings.marginBottom = m.bottom;
            this.pageSettings.marginLeft = m.left;
            this.pageSettings.marginRight = m.right;
            this.saveState();
        }
    },

    pageSizes: {
        letter: { width: 816, height: 1056 },
        a4: { width: 794, height: 1123 },
        a3: { width: 1123, height: 1587 },
        legal: { width: 816, height: 1344 },
        a5: { width: 559, height: 794 },
        b5: { width: 665, height: 945 },
        executive: { width: 696, height: 1008 },
        tabloid: { width: 1056, height: 1632 }
    },

    setPageSize(size) {
        const s = this.pageSizes[size];
        if (s) {
            this.pageSettings.size = size;
            if (this.pageSettings.orientation === 'landscape') {
                this.pageSettings.width = s.height;
                this.pageSettings.height = s.width;
            } else {
                this.pageSettings.width = s.width;
                this.pageSettings.height = s.height;
            }
            this.saveState();
        }
    },

    setOrientation(orientation) {
        if (orientation !== this.pageSettings.orientation) {
            this.pageSettings.orientation = orientation;
            const w = this.pageSettings.width;
            this.pageSettings.width = this.pageSettings.height;
            this.pageSettings.height = w;
            this.saveState();
        }
    }
};

window.DocModel = DocModel;
