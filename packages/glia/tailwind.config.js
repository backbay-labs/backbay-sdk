/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neon accents (--glia-tw-* with bare-name fallback for backward compat)
        "cyan-neon": "hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / <alpha-value>)",
        "magenta-neon": "hsl(var(--glia-tw-magenta-neon, var(--magenta-neon)) / <alpha-value>)",
        "emerald-neon": "hsl(var(--glia-tw-emerald-neon, var(--emerald-neon)) / <alpha-value>)",
        "violet-neon": "hsl(var(--glia-tw-violet-neon, var(--violet-neon)) / <alpha-value>)",
        "yellow-warning": "hsl(var(--glia-tw-yellow-warning, var(--yellow-warning)) / <alpha-value>)",

        // Semantic colors
        border: "hsl(var(--glia-tw-border, var(--border)) / <alpha-value>)",
        input: "hsl(var(--glia-tw-input, var(--input)) / <alpha-value>)",
        ring: "hsl(var(--glia-tw-ring, var(--ring)) / <alpha-value>)",
        background: "hsl(var(--glia-tw-background, var(--background)) / <alpha-value>)",
        foreground: "hsl(var(--glia-tw-foreground, var(--foreground)) / <alpha-value>)",

        primary: {
          DEFAULT: "hsl(var(--glia-tw-primary, var(--primary)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-primary-foreground, var(--primary-foreground)) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--glia-tw-secondary, var(--secondary)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-secondary-foreground, var(--secondary-foreground)) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--glia-tw-destructive, var(--destructive)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-destructive-foreground, var(--destructive-foreground)) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--glia-tw-muted, var(--muted)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-muted-foreground, var(--muted-foreground)) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--glia-tw-accent, var(--accent)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-accent-foreground, var(--accent-foreground)) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--glia-tw-popover, var(--popover)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-popover-foreground, var(--popover-foreground)) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--glia-tw-card, var(--card)) / <alpha-value>)",
          foreground: "hsl(var(--glia-tw-card-foreground, var(--card-foreground)) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--glia-radius-lg, var(--radius))",
        md: "var(--glia-radius-md, calc(var(--radius) - 2px))",
        sm: "var(--glia-radius-sm, calc(var(--radius) - 4px))",
      },
      boxShadow: {
        xs: "0 1px 1px 0 rgb(0 0 0 / 0.05)",
        // Neon glow shadows
        "neon-cyan": "0 0 20px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.4), 0 0 40px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.2)",
        "neon-magenta": "0 0 20px hsl(var(--glia-tw-magenta-neon, var(--magenta-neon)) / 0.4), 0 0 40px hsl(var(--glia-tw-magenta-neon, var(--magenta-neon)) / 0.2)",
        "neon-emerald": "0 0 20px hsl(var(--glia-tw-emerald-neon, var(--emerald-neon)) / 0.4), 0 0 40px hsl(var(--glia-tw-emerald-neon, var(--emerald-neon)) / 0.2)",
        glow: "0 0 16px 1px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.4)",
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
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.5), 0 0 30px hsl(var(--glia-tw-cyan-neon, var(--cyan-neon)) / 0.3)" },
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
