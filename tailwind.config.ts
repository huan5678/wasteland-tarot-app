import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fallout Pip-Boy Colors
        "pip-boy-green": "var(--color-pip-boy-green)",
        "pip-boy-green-bright": "var(--color-pip-boy-green-bright)",
        "pip-boy-green-dark": "var(--color-pip-boy-green-dark)",
        "pip-boy-green-medium": "var(--color-pip-boy-green-medium)",
        "pip-boy-green-deep": "var(--color-pip-boy-green-deep)",
        "pip-boy-green-faded": "var(--color-pip-boy-green-faded)",

        // Terminal Colors
        "terminal-green": "var(--color-terminal-green)",
        "terminal-green-bright": "var(--color-terminal-green-bright)",
        "terminal-green-dim": "var(--color-terminal-green-dim)",

        // Vault Colors
        "vault-blue": "var(--color-vault-blue)",
        "vault-blue-light": "var(--color-vault-blue-light)",
        "vault-blue-dark": "var(--color-vault-blue-dark)",
        "vault-blue-deep": "var(--color-vault-blue-deep)",

        // Wasteland Colors
        "wasteland-dark": "var(--color-wasteland-dark)",
        "wasteland-darker": "var(--color-wasteland-darker)",
        "wasteland-medium": "var(--color-wasteland-medium)",
        "wasteland-light": "var(--color-wasteland-light)",
        "wasteland-lighter": "var(--color-wasteland-lighter)",

        // Metal Colors
        "metal-gray": "var(--color-metal-gray)",
        "metal-gray-light": "var(--color-metal-gray-light)",
        "metal-gray-dark": "var(--color-metal-gray-dark)",
        "metal-gray-rust": "var(--color-metal-gray-rust)",

        // Concrete Colors
        "concrete": "var(--color-concrete)",
        "concrete-light": "var(--color-concrete-light)",
        "concrete-dark": "var(--color-concrete-dark)",

        // Radiation Colors
        "radiation-orange": "var(--color-radiation-orange)",
        "radiation-orange-bright": "var(--color-radiation-orange-bright)",
        "radiation-orange-dark": "var(--color-radiation-orange-dark)",
        "radiation-orange-deep": "var(--color-radiation-orange-deep)",

        // Warning Colors
        "warning-yellow": "var(--color-warning-yellow)",
        "warning-yellow-bright": "var(--color-warning-yellow-bright)",
        "warning-yellow-dark": "var(--color-warning-yellow-dark)",

        // Rust Colors
        "rust-brown": "var(--color-rust-brown)",
        "rust-light": "var(--color-rust-light)",
        "rust-dark": "var(--color-rust-dark)",
        "rust-red": "var(--color-rust-red)",

        // Status Colors
        "success": "var(--color-success)",
        "success-bg": "var(--color-success-bg)",
        "success-border": "var(--color-success-border)",
        "warning": "var(--color-warning)",
        "warning-bg": "var(--color-warning-bg)",
        "warning-border": "var(--color-warning-border)",
        "error": "var(--color-error)",
        "error-bg": "var(--color-error-bg)",
        "error-border": "var(--color-error-border)",
        "info": "var(--color-info)",
        "info-bg": "var(--color-info-bg)",
        "info-border": "var(--color-info-border)",

        // Text Colors - Enhanced for Accessibility
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-disabled": "var(--color-text-disabled)",
        "text-inverse": "var(--color-text-inverse)",
        "text-high-contrast": "var(--color-text-high-contrast)",
        "text-error": "var(--color-text-error)",
        "text-warning": "var(--color-text-warning)",
        "enhanced-secondary": "var(--color-text-secondary)",
        "enhanced-muted": "var(--color-text-muted)",

        // Link Colors
        "link": "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        "link-visited": "var(--color-link-visited)",
        "link-active": "var(--color-link-active)",

        // Border Colors
        "border-primary": "var(--color-border-primary)",
        "border-secondary": "var(--color-border-secondary)",
        "border-muted": "var(--color-border-muted)",
        "border-focus": "var(--color-border-focus)",

        // Background Colors
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-tertiary": "var(--color-bg-tertiary)",
        "bg-overlay": "var(--color-bg-overlay)",

        // Button Colors
        "btn-primary-bg": "var(--color-btn-primary-bg)",
        "btn-primary-fg": "var(--color-btn-primary-fg)",
        "btn-primary-hover": "var(--color-btn-primary-hover)",
        "btn-primary-active": "var(--color-btn-primary-active)",
        "btn-secondary-bg": "var(--color-btn-secondary-bg)",
        "btn-secondary-fg": "var(--color-btn-secondary-fg)",
        "btn-secondary-hover": "var(--color-btn-secondary-hover)",
        "btn-secondary-border": "var(--color-btn-secondary-border)",
        "btn-danger-bg": "var(--color-btn-danger-bg)",
        "btn-danger-fg": "var(--color-btn-danger-fg)",
        "btn-danger-hover": "var(--color-btn-danger-hover)",
        "btn-warning-bg": "var(--color-btn-warning-bg)",
        "btn-warning-fg": "var(--color-btn-warning-fg)",
        "btn-warning-hover": "var(--color-btn-warning-hover)",

        // Input Colors
        "input-bg": "var(--color-input-bg)",
        "input-fg": "var(--color-input-fg)",
        "input-border": "var(--color-input-border)",
        "input-border-focus": "var(--color-input-border-focus)",
        "input-placeholder": "var(--color-input-placeholder)",

        // Tarot Colors
        "tarot-gold": "var(--color-tarot-gold)",
        "tarot-gold-dark": "var(--color-tarot-gold-dark)",
        "tarot-mystical": "var(--color-tarot-mystical)",

        // shadcn/ui compatibility
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "Monaco", "Courier New", "monospace"],
        doto: ["var(--font-doto)", "monospace"],
      },
      animation: {
        "text-flicker": "text-flicker 2s ease-in-out infinite",
        "radiation-pulse": "radiation-pulse 1.5s ease-in-out infinite",
        "terminal-cursor": "terminal-cursor 1s ease-in-out infinite",
        "grid-flicker": "grid-flicker 8s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
        "interference": "interference 0.1s linear infinite",
        // Enhanced Card Animations
        "card-hover": "card-hover 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "card-flip": "card-flip 0.6s cubic-bezier(0.4, 0.3, 0.2, 1)",
        "card-draw": "card-draw 1.2s cubic-bezier(0.23, 1, 0.32, 1)",
        "card-reveal": "card-reveal 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
        "card-position": "card-position 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "card-selection": "card-selection 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "card-glow": "card-glow 2s ease-in-out infinite",
        "card-shimmer": "card-shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "text-flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "radiation-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px var(--color-glow-yellow)" },
          "50%": { boxShadow: "0 0 15px var(--color-glow-yellow)" },
        },
        "terminal-cursor": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "grid-flicker": {
          "0%, 100%": { opacity: "0.05" },
          "50%": { opacity: "0.15" },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px)",
            opacity: "0.3",
          },
          "25%": {
            transform: "translateY(-20px) translateX(10px)",
            opacity: "0.7",
          },
          "50%": {
            transform: "translateY(-10px) translateX(-5px)",
            opacity: "1",
          },
          "75%": {
            transform: "translateY(-30px) translateX(15px)",
            opacity: "0.5",
          },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "interference": {
          "0%": { transform: "translateX(0px)" },
          "100%": { transform: "translateX(4px)" },
        },
        // Enhanced Card Animation Keyframes
        "card-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(0, 255, 127, 0.3), 0 0 10px rgba(0, 255, 127, 0.1)"
          },
          "50%": {
            boxShadow: "0 0 15px rgba(0, 255, 127, 0.5), 0 0 25px rgba(0, 255, 127, 0.2)"
          },
        },
        "card-shimmer": {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;