import { heroui } from "@heroui/react";

export default heroui({
  themes: {
    dark: {
      colors: {
        background: "#0a0a0f",
        foreground: "#e4e4ef",
        primary: {
          50: "#e6f7fd",
          100: "#b3e6f9",
          200: "#80d5f5",
          300: "#4dc4f1",
          400: "#1ab3ed",
          500: "#00aeef",
          600: "#008bbf",
          700: "#00688f",
          800: "#004660",
          900: "#002330",
          DEFAULT: "#00aeef",
          foreground: "#ffffff",
        },
        content1: "#12121a",
        content2: "#1a1a28",
        content3: "#22222f",
        content4: "#2a2a3a",
        default: {
          50: "#12121a",
          100: "#1a1a28",
          200: "#2a2a3a",
          300: "#3a3a4a",
          400: "#5a5a70",
          500: "#8888a0",
          600: "#a0a0b8",
          700: "#c0c0d0",
          800: "#d8d8e8",
          900: "#e4e4ef",
          DEFAULT: "#2a2a3a",
          foreground: "#e4e4ef",
        },
        success: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#eab308",
          foreground: "#000000",
        },
        danger: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
      },
    },
  },
});
