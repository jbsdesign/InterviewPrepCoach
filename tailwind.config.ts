import type { Config } from "tailwindcss";

const config = {
  // Use class-based dark mode so toggling the `dark` class on <html> controls all `dark:` styles.
  darkMode: ["class", "html.dark"],
  content: ["./app/**/*.{ts,tsx,js,jsx}"],
} satisfies Config;

export default config;
