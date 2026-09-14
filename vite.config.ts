import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: {
    outDir: "static/blog-ui",
    emptyOutDir: true,
    lib: {
      entry: "frontend/blog.tsx",
      formats: ["es"],
      fileName: () => "background-paths.js",
      cssFileName: "background-paths",
    },
    minify: true,
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
