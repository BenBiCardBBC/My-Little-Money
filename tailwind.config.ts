import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#1c2634", mint: "#10b981" } } }, plugins: [] } satisfies Config;
