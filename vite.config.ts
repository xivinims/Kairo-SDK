import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview, mode }) => {
  const desktop = mode === "desktop";

  return {
    base: desktop ? "./" : "/",
    server: { host: "0.0.0.0", port: 8080, strictPort: true },
    preview: { host: "127.0.0.1", port: 8081, strictPort: true },
    resolve: { tsconfigPaths: true },
    build: desktop
      ? {
          outDir: "dist",
          emptyOutDir: true,
        }
      : undefined,
    plugins: [
      tailwindcss(),
      ...(desktop
        ? []
        : [
            tanstackStart(),
            ...(command === "build" || isPreview ? [nitro({ preset: "vercel" })] : []),
          ]),
      viteReact(),
    ],
  };
});
