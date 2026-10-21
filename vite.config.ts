import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
export default defineConfig(({ mode }) => ({
    plugins:
        mode === "demo"
            ? [vue()]
            : [
                  laravel({ input: ["resources/js/app.ts"], refresh: true }),
                  vue(),
              ],
    define: {
        "import.meta.env.VITE_DEMO_MODE": JSON.stringify(
            mode === "demo" ? "true" : "false",
        ),
    },
    server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
    build:
        mode === "demo"
            ? { outDir: "dist", target: "es2020" }
            : { target: "es2020" },
}));
