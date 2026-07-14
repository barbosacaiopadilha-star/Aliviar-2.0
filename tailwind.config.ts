import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          "primary-deep": "var(--color-brand-primary-deep)",
          sage: "var(--color-brand-sage)",
          "sage-light": "var(--color-brand-sage-light)",
          gold: "var(--color-brand-gold)",
        },
        canvas: "var(--color-bg-canvas)",
        surface: "var(--color-bg-surface)",
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
        },
        border: "var(--color-border)",
        focus: "var(--color-focus-ring)",
        success: {
          DEFAULT: "var(--color-success)",
          surface: "var(--color-success-surface)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          surface: "var(--color-warning-surface)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          surface: "var(--color-error-surface)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-public-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--text-xs--line-height)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--text-sm--line-height)" }],
        base: ["var(--text-base)", { lineHeight: "var(--text-base--line-height)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--text-lg--line-height)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--text-xl--line-height)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--text-2xl--line-height)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--text-3xl--line-height)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--text-4xl--line-height)" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      maxWidth: {
        content: "var(--content-max-width)",
        reading: "var(--reading-max-width)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        "sticky-header": "var(--z-sticky-header)",
        drawer: "var(--z-drawer)",
        "modal-overlay": "var(--z-modal-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
      },
    },
  },
  plugins: [],
};

export default config;
