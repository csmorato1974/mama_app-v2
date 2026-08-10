// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Nitro reescribe dist/server y deja index.mjs, pero el prerender de TanStack
// carga dist/server/server.js. Este puente lo recrea antes del prerender.
const puenteEntradaServidor = {
  name: "puente-entrada-servidor-prerender",
  closeBundle: {
    order: "post" as const,
    handler() {
      const dir = resolve(process.cwd(), "dist/server");
      const origen = resolve(dir, "index.mjs");
      const destino = resolve(dir, "server.js");
      if (existsSync(origen) && !existsSync(destino)) copyFileSync(origen, destino);
    },
  },
};

export default defineConfig({
  vite: {
    plugins: [puenteEntradaServidor],
  },
  tanstackStart: {
    // SPA shell para que la aplicación completa pueda empaquetarse como APK.
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
      },
    },
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

