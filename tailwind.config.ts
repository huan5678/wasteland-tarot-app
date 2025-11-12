import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 *
 * In v4, most theme customization is done via @theme in CSS files.
 * This config file is kept minimal and only used for:
 * - Content paths
 * - Plugins
 * - Settings that can't be configured in CSS
 *
 * Note: Animation support is provided by tw-animate-css imported in globals.css
 * (Tailwind v4's CSS-first approach, not JS plugins)
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
} satisfies Config;

export default config;
