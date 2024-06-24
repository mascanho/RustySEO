import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "custom-base-red": "#ff2f23",
        "custom-light-red": "#fb4a40",
        "custom-white": "#fefcfb",
        "custom-dark-gray": "#5f5f6c",
        "custom-light-gray": "#f7f7f7",
        "custom-border-gray": "#eeeeee",
        "custom-footer-bg": "#1d2124",
        apple: {
          blue: "#0070CD", // Apple's traditional blue color
          silver: "#D3D3D3", // Silver used in Apple devices
          spaceGray: "#333333", // Space Gray used in Apple products
          gold: "#D7B590", // Gold used in some Apple products
          white: "#FFFFFF", // Apple's classic white color
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
