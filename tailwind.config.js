const defaultColors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            black: '#000000',
            white: '#FFFFFF',
            zinc: defaultColors.zinc, // keeping grayscale as acceptable neutral
            neutral: defaultColors.neutral,
            gray: defaultColors.gray,
            slate: defaultColors.slate,
            stone: defaultColors.stone,
            // Core Brand Color
            orange: {
                ...defaultColors.orange,
                50: '#fff0e6',
                100: '#ffdbbf',
                200: '#ffc193',
                300: '#ff9d59',
                400: '#ff7728',
                500: '#FF6200', // Our strict brand color
                600: '#db4b00',
                700: '#b73700',
                800: '#922900',
                900: '#762200',
                950: '#400e00',
                DEFAULT: '#FF6200'
            },
            // Enforce brand by aliasing other colors used in the codebase to Orange or Grayscale
            red: { ...defaultColors.orange, 500: '#FF6200', DEFAULT: '#FF6200' },
            yellow: { ...defaultColors.orange, 500: '#FF6200', DEFAULT: '#FF6200' },
            green: { ...defaultColors.zinc },
            blue: { ...defaultColors.zinc },
            indigo: { ...defaultColors.zinc },
            purple: { ...defaultColors.zinc },
            pink: { ...defaultColors.zinc },
            cyan: { ...defaultColors.zinc },
            teal: { ...defaultColors.zinc },
            emerald: { ...defaultColors.zinc },
            rose: { ...defaultColors.zinc },
            fuchsia: { ...defaultColors.zinc },
            violet: { ...defaultColors.zinc },
            sky: { ...defaultColors.zinc },
            amber: { ...defaultColors.orange, 500: '#FF6200', DEFAULT: '#FF6200' },
            lime: { ...defaultColors.zinc }
        },
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))',
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--font-manrope)", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
                heading: ["var(--font-outfit)", "sans-serif"],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "marquee": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-100%)" },
                },
                "scroll-text": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-100%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "marquee": "marquee 25s linear infinite",
                "scroll-text": "scroll-text 20s linear infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
