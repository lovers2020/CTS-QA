import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), "");

    // Prioritize VITE_API_KEY from .env, then API_KEY, then system env
    const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.API_KEY || "";

    return {
        plugins: [react()],
        define: {
            // Define global variable replacement.
            // JSON.stringify is essential to wrap the string value in quotes.
            "process.env.API_KEY": JSON.stringify(apiKey),
        },
    };
});
