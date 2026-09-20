import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-container": "#1f5e3b",
        "secondary-container": "#b3efa7",
        "surface-container-lowest": "#ffffff",
        "tertiary": "#003491",
        "tertiary-container": "#0049c2",
        "on-primary-container": "#95d5a9",
        "surface-container": "#e6eeff",
        "on-primary-fixed-variant": "#0e5130",
        "on-background": "#121c2a",
        "secondary-fixed": "#b6f2aa",
        "primary": "#004626",
        "surface-container-highest": "#d9e3f6",
        "tertiary-fixed-dim": "#b4c5ff",
        "surface-variant": "#d9e3f6",
        "outline-variant": "#c0c9bf",
        "on-secondary-fixed-variant": "#1c511b",
        "surface-container-high": "#dee9fc",
        "on-error-container": "#93000a",
        "primary-fixed-dim": "#95d5a8",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "outline": "#707971",
        "on-tertiary-container": "#b5c5ff",
        "surface-dim": "#d0dbed",
        "on-secondary": "#ffffff",
        "secondary-fixed-dim": "#9bd590",
        "on-surface-variant": "#404942",
        "on-tertiary-fixed": "#00174b",
        "error": "#ba1a1a",
        "surface-bright": "#f8f9ff",
        "on-secondary-fixed": "#002202",
        "inverse-primary": "#95d5a8",
        "inverse-surface": "#27313f",
        "on-surface": "#121c2a",
        "on-primary": "#ffffff",
        "secondary": "#356a31",
        "on-secondary-container": "#396e34",
        "tertiary-fixed": "#dbe1ff",
        "on-tertiary-fixed-variant": "#003ea8",
        "on-error": "#ffffff",
        "surface-container-low": "#eff4ff",
        "inverse-on-surface": "#eaf1ff",
        "primary-fixed": "#b0f1c3",
        "background": "#f8f9ff",
        "surface": "#f8f9ff",
        "on-primary-fixed": "#00210f",
        "surface-tint": "#2c6a46"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        sans: ["Public Sans", "sans-serif"]
      }
    }
  },
  plugins: [forms, containerQueries],
};
