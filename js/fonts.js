// fonts.js — 200+ Professional Fonts via Google Fonts
const FontManager = {
    fonts: [
        // Sans-Serif
        { name: 'Inter', category: 'Sans-Serif' },
        { name: 'Roboto', category: 'Sans-Serif' },
        { name: 'Open Sans', category: 'Sans-Serif' },
        { name: 'Lato', category: 'Sans-Serif' },
        { name: 'Montserrat', category: 'Sans-Serif' },
        { name: 'Poppins', category: 'Sans-Serif' },
        { name: 'Nunito', category: 'Sans-Serif' },
        { name: 'Raleway', category: 'Sans-Serif' },
        { name: 'Ubuntu', category: 'Sans-Serif' },
        { name: 'Work Sans', category: 'Sans-Serif' },
        { name: 'Rubik', category: 'Sans-Serif' },
        { name: 'Outfit', category: 'Sans-Serif' },
        { name: 'Manrope', category: 'Sans-Serif' },
        { name: 'DM Sans', category: 'Sans-Serif' },
        { name: 'Lexend', category: 'Sans-Serif' },
        { name: 'Mulish', category: 'Sans-Serif' },
        { name: 'Quicksand', category: 'Sans-Serif' },
        { name: 'Cabin', category: 'Sans-Serif' },
        { name: 'Barlow', category: 'Sans-Serif' },
        { name: 'Karla', category: 'Sans-Serif' },
        { name: 'Hind', category: 'Sans-Serif' },
        { name: 'Nunito Sans', category: 'Sans-Serif' },
        { name: 'Josefin Sans', category: 'Sans-Serif' },
        { name: 'Exo 2', category: 'Sans-Serif' },
        { name: 'Fira Sans', category: 'Sans-Serif' },
        { name: 'Catamaran', category: 'Sans-Serif' },
        { name: 'Asap', category: 'Sans-Serif' },
        { name: 'Overpass', category: 'Sans-Serif' },
        { name: 'Signika', category: 'Sans-Serif' },
        { name: 'Maven Pro', category: 'Sans-Serif' },
        { name: 'Questrial', category: 'Sans-Serif' },
        { name: 'Archivo', category: 'Sans-Serif' },
        { name: 'Red Hat Display', category: 'Sans-Serif' },
        { name: 'Albert Sans', category: 'Sans-Serif' },
        { name: 'Plus Jakarta Sans', category: 'Sans-Serif' },
        { name: 'Figtree', category: 'Sans-Serif' },
        { name: 'Sora', category: 'Sans-Serif' },
        { name: 'Space Grotesk', category: 'Sans-Serif' },
        { name: 'Be Vietnam Pro', category: 'Sans-Serif' },
        { name: 'Urbanist', category: 'Sans-Serif' },
        { name: 'Jost', category: 'Sans-Serif' },
        { name: 'Heebo', category: 'Sans-Serif' },
        { name: 'Kanit', category: 'Sans-Serif' },
        { name: 'Titillium Web', category: 'Sans-Serif' },
        { name: 'IBM Plex Sans', category: 'Sans-Serif' },
        { name: 'Noto Sans', category: 'Sans-Serif' },
        { name: 'Source Sans 3', category: 'Sans-Serif' },
        { name: 'PT Sans', category: 'Sans-Serif' },
        { name: 'Dosis', category: 'Sans-Serif' },
        { name: 'Varela Round', category: 'Sans-Serif' },
        { name: 'Assistant', category: 'Sans-Serif' },
        { name: 'Libre Franklin', category: 'Sans-Serif' },
        { name: 'Encode Sans', category: 'Sans-Serif' },
        { name: 'Public Sans', category: 'Sans-Serif' },
        { name: 'Chivo', category: 'Sans-Serif' },
        { name: 'Sarabun', category: 'Sans-Serif' },
        { name: 'Prompt', category: 'Sans-Serif' },
        { name: 'Yantramanav', category: 'Sans-Serif' },

        // Serif
        { name: 'Playfair Display', category: 'Serif' },
        { name: 'Merriweather', category: 'Serif' },
        { name: 'Lora', category: 'Serif' },
        { name: 'PT Serif', category: 'Serif' },
        { name: 'Noto Serif', category: 'Serif' },
        { name: 'Source Serif 4', category: 'Serif' },
        { name: 'Libre Baskerville', category: 'Serif' },
        { name: 'Crimson Text', category: 'Serif' },
        { name: 'EB Garamond', category: 'Serif' },
        { name: 'Cormorant Garamond', category: 'Serif' },
        { name: 'Bitter', category: 'Serif' },
        { name: 'Arvo', category: 'Serif' },
        { name: 'Cardo', category: 'Serif' },
        { name: 'Vollkorn', category: 'Serif' },
        { name: 'Old Standard TT', category: 'Serif' },
        { name: 'Spectral', category: 'Serif' },
        { name: 'Alegreya', category: 'Serif' },
        { name: 'Gentium Book Plus', category: 'Serif' },
        { name: 'DM Serif Display', category: 'Serif' },
        { name: 'DM Serif Text', category: 'Serif' },
        { name: 'Philosopher', category: 'Serif' },
        { name: 'Unna', category: 'Serif' },
        { name: 'Aleo', category: 'Serif' },
        { name: 'Frank Ruhl Libre', category: 'Serif' },
        { name: 'Coustard', category: 'Serif' },
        { name: 'Domine', category: 'Serif' },
        { name: 'Nanum Myeongjo', category: 'Serif' },
        { name: 'Cormorant', category: 'Serif' },
        { name: 'Sorts Mill Goudy', category: 'Serif' },
        { name: 'Bodoni Moda', category: 'Serif' },
        { name: 'Fraunces', category: 'Serif' },
        { name: 'Brygada 1918', category: 'Serif' },
        { name: 'Newsreader', category: 'Serif' },
        { name: 'Literata', category: 'Serif' },
        { name: 'Crimson Pro', category: 'Serif' },
        { name: 'Gelasio', category: 'Serif' },

        // Monospace
        { name: 'Roboto Mono', category: 'Monospace' },
        { name: 'Source Code Pro', category: 'Monospace' },
        { name: 'JetBrains Mono', category: 'Monospace' },
        { name: 'Fira Code', category: 'Monospace' },
        { name: 'IBM Plex Mono', category: 'Monospace' },
        { name: 'Space Mono', category: 'Monospace' },
        { name: 'Inconsolata', category: 'Monospace' },
        { name: 'Ubuntu Mono', category: 'Monospace' },
        { name: 'PT Mono', category: 'Monospace' },
        { name: 'Cousine', category: 'Monospace' },
        { name: 'Anonymous Pro', category: 'Monospace' },
        { name: 'Red Hat Mono', category: 'Monospace' },
        { name: 'DM Mono', category: 'Monospace' },
        { name: 'Noto Sans Mono', category: 'Monospace' },
        { name: 'Overpass Mono', category: 'Monospace' },

        // Display
        { name: 'Bebas Neue', category: 'Display' },
        { name: 'Anton', category: 'Display' },
        { name: 'Oswald', category: 'Display' },
        { name: 'Syne', category: 'Display' },
        { name: 'Righteous', category: 'Display' },
        { name: 'Archivo Black', category: 'Display' },
        { name: 'Bungee', category: 'Display' },
        { name: 'Russo One', category: 'Display' },
        { name: 'Staatliches', category: 'Display' },
        { name: 'Black Ops One', category: 'Display' },
        { name: 'Alfa Slab One', category: 'Display' },
        { name: 'Fugaz One', category: 'Display' },
        { name: 'Passion One', category: 'Display' },
        { name: 'Bungee Shade', category: 'Display' },
        { name: 'Monoton', category: 'Display' },
        { name: 'Fredoka', category: 'Display' },
        { name: 'Lilita One', category: 'Display' },
        { name: 'Teko', category: 'Display' },
        { name: 'Secular One', category: 'Display' },
        { name: 'Francois One', category: 'Display' },
        { name: 'Chakra Petch', category: 'Display' },
        { name: 'Saira', category: 'Display' },
        { name: 'Orbitron', category: 'Display' },
        { name: 'Coda', category: 'Display' },
        { name: 'Bowlby One SC', category: 'Display' },

        // Handwriting / Script
        { name: 'Dancing Script', category: 'Handwriting' },
        { name: 'Pacifico', category: 'Handwriting' },
        { name: 'Caveat', category: 'Handwriting' },
        { name: 'Satisfy', category: 'Handwriting' },
        { name: 'Great Vibes', category: 'Handwriting' },
        { name: 'Sacramento', category: 'Handwriting' },
        { name: 'Kalam', category: 'Handwriting' },
        { name: 'Indie Flower', category: 'Handwriting' },
        { name: 'Shadows Into Light', category: 'Handwriting' },
        { name: 'Gloria Hallelujah', category: 'Handwriting' },
        { name: 'Amatic SC', category: 'Handwriting' },
        { name: 'Patrick Hand', category: 'Handwriting' },
        { name: 'Architects Daughter', category: 'Handwriting' },
        { name: 'Permanent Marker', category: 'Handwriting' },
        { name: 'Courgette', category: 'Handwriting' },
        { name: 'Handlee', category: 'Handwriting' },
        { name: 'Kaushan Script', category: 'Handwriting' },
        { name: 'Yellowtail', category: 'Handwriting' },
        { name: 'Cookie', category: 'Handwriting' },
        { name: 'Tangerine', category: 'Handwriting' },
        { name: 'Marck Script', category: 'Handwriting' },
        { name: 'Allura', category: 'Handwriting' },
        { name: 'Alex Brush', category: 'Handwriting' },
        { name: 'Pinyon Script', category: 'Handwriting' },
        { name: 'Rouge Script', category: 'Handwriting' },
        { name: 'Lobster', category: 'Handwriting' },
        { name: 'Lobster Two', category: 'Handwriting' },
        { name: 'Comforter Brush', category: 'Handwriting' },
        { name: 'Edu VIC WA NT Beginner', category: 'Handwriting' },
        { name: 'Cedarville Cursive', category: 'Handwriting' },

        // Additional professional fonts
        { name: 'Abel', category: 'Sans-Serif' },
        { name: 'Acme', category: 'Display' },
        { name: 'Alata', category: 'Sans-Serif' },
        { name: 'Aldrich', category: 'Sans-Serif' },
        { name: 'Amiri', category: 'Serif' },
        { name: 'Antic Slab', category: 'Serif' },
        { name: 'Arimo', category: 'Sans-Serif' },
        { name: 'Atkinson Hyperlegible', category: 'Sans-Serif' },
        { name: 'Bai Jamjuree', category: 'Sans-Serif' },
        { name: 'Baloo 2', category: 'Display' },
        { name: 'BenchNine', category: 'Sans-Serif' },
        { name: 'Cantarell', category: 'Sans-Serif' },
        { name: 'Comfortaa', category: 'Display' },
        { name: 'Commissioner', category: 'Sans-Serif' },
        { name: 'Cormorant Upright', category: 'Serif' },
        { name: 'Cuprum', category: 'Sans-Serif' },
        { name: 'Didact Gothic', category: 'Sans-Serif' },
        { name: 'Economica', category: 'Sans-Serif' },
        { name: 'Electrolize', category: 'Sans-Serif' },
        { name: 'Epilogue', category: 'Sans-Serif' },
        { name: 'Fira Sans Condensed', category: 'Sans-Serif' },
        { name: 'Georama', category: 'Sans-Serif' },
        { name: 'Gudea', category: 'Sans-Serif' },
        { name: 'Hanken Grotesk', category: 'Sans-Serif' },
        { name: 'Hind Madurai', category: 'Sans-Serif' },
        { name: 'Inria Sans', category: 'Sans-Serif' },
        { name: 'Inria Serif', category: 'Serif' },
        { name: 'Inter Tight', category: 'Sans-Serif' },
        { name: 'Khand', category: 'Sans-Serif' },
        { name: 'League Spartan', category: 'Sans-Serif' },
        { name: 'Lexend Deca', category: 'Sans-Serif' },
        { name: 'M PLUS Rounded 1c', category: 'Sans-Serif' },
        { name: 'Maven Pro', category: 'Sans-Serif' },
        { name: 'Nanum Gothic', category: 'Sans-Serif' },
        { name: 'Niramit', category: 'Sans-Serif' },
        { name: 'Pathway Gothic One', category: 'Sans-Serif' },
        { name: 'Play', category: 'Sans-Serif' },
        { name: 'Proza Libre', category: 'Sans-Serif' },
        { name: 'Readex Pro', category: 'Sans-Serif' },
        { name: 'Red Hat Text', category: 'Sans-Serif' },
        { name: 'Saira Condensed', category: 'Sans-Serif' },
        { name: 'Schibsted Grotesk', category: 'Sans-Serif' },
        { name: 'Sen', category: 'Sans-Serif' },
        { name: 'Signika Negative', category: 'Sans-Serif' },
        { name: 'Sora', category: 'Sans-Serif' },
        { name: 'Spline Sans', category: 'Sans-Serif' },
        { name: 'Tenor Sans', category: 'Sans-Serif' },
        { name: 'Wix Madefor Display', category: 'Sans-Serif' },
        { name: 'Ysabeau', category: 'Sans-Serif' },
        { name: 'Zilla Slab', category: 'Serif' },
    ],

    recentFonts: [],
    loadedFonts: new Set(),

    init() {
        this.loadInitialFonts();
    },

    loadInitialFonts() {
        const initial = this.fonts.slice(0, 30).map(f => f.name.replace(/ /g, '+'));
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?${initial.map(f => `family=${f}:wght@300;400;500;600;700`).join('&')}&display=swap`;
        document.head.appendChild(link);
        initial.forEach(f => this.loadedFonts.add(f.replace(/\+/g, ' ')));
    },

    loadFont(fontName) {
        if (this.loadedFonts.has(fontName)) return Promise.resolve();
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
            link.onload = () => {
                this.loadedFonts.add(fontName);
                resolve();
            };
            link.onerror = () => resolve();
            document.head.appendChild(link);
        });
    },

    addToRecent(fontName) {
        this.recentFonts = this.recentFonts.filter(f => f !== fontName);
        this.recentFonts.unshift(fontName);
        if (this.recentFonts.length > 10) this.recentFonts.pop();
    },

    getByCategory(category) {
        return this.fonts.filter(f => f.category === category);
    },

    getCategories() {
        return [...new Set(this.fonts.map(f => f.category))];
    },

    search(query) {
        const q = query.toLowerCase();
        return this.fonts.filter(f => f.name.toLowerCase().includes(q));
    }
};

window.FontManager = FontManager;
