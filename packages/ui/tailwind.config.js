/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Nebula theme neon accents
        "cyan-neon": "hsl(var(--cyan-neon) / <alpha-value>)",
        "magenta-neon": "hsl(var(--magenta-neon) / <alpha-value>)",
        "emerald-neon": "hsl(var(--emerald-neon) / <alpha-value>)",
        "violet-neon": "hsl(var(--violet-neon) / <alpha-value>)",
        "yellow-warning": "hsl(var(--yellow-warning) / <alpha-value>)",

        // Semantic colors
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 1px 0 rgb(0 0 0 / 0.05)",
        // Neon glow shadows
        "neon-cyan": "0 0 20px hsl(var(--cyan-neon) / 0.4), 0 0 40px hsl(var(--cyan-neon) / 0.2)",
        "neon-magenta": "0 0 20px hsl(var(--magenta-neon) / 0.4), 0 0 40px hsl(var(--magenta-neon) / 0.2)",
        "neon-emerald": "0 0 20px hsl(var(--emerald-neon) / 0.4), 0 0 40px hsl(var(--emerald-neon) / 0.2)",
        glow: "0 0 16px 1px hsl(var(--cyan-neon) / 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.02)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Cinzel", "serif"],
      },
      animation: {
        "soft-glow": "soft-glow 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        "soft-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--cyan-neon) / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--cyan-neon) / 0.5), 0 0 30px hsl(var(--cyan-neon) / 0.3)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        aurora: {
          "0%": { backgroundPosition: "50% 50%, 50% 50%" },
          "100%": { backgroundPosition: "350% 50%, 350% 50%" },
        },
      },
    },
  },
  plugins: [],
};
