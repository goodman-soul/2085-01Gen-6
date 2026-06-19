/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        "medical-blue": {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
        },
        "life-green": {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#D1FAE5",
        },
        "warn-orange": "#F59E0B",
        "danger-red": "#EF4444",
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
      },
      animation: {
        "scan-line": "scanLine 2s linear infinite",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.33)" },
          "80%, 100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
