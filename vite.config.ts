// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Nitro reescribe dist/server y deja index.mjs (worker de Cloudflare, que espera
// `env.ASSETS`), pero el prerender de TanStack importa dist/server/server.js y
// llama a fetch(request) sin entorno. Este puente genera ese archivo con un
// entorno mínimo que sirve los estáticos desde dist/client.
const PUENTE = `import worker from "./index.mjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const clienteDir = new URL("../client/", import.meta.url);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const env = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      const rel = decodeURIComponent(url.pathname.replace(/^\\/+/, ""));
      if (!rel) return new Response(null, { status: 404 });
      try {
        const ruta = fileURLToPath(new URL(rel, clienteDir));
        const datos = await readFile(ruta);
        const ext = rel.slice(rel.lastIndexOf("."));
        return new Response(datos, {
          headers: { "content-type": TIPOS[ext] ?? "application/octet-stream" },
        });
      } catch {
        return new Response(null, { status: 404 });
      }
    },
  },
};

const ctx = { waitUntil() {}, passThroughOnException() {} };

export default { fetch: (request) => worker.fetch(request, env, ctx) };
`;

const puenteEntradaServidor = {
  name: "puente-entrada-servidor-prerender",
  closeBundle: {
    order: "post" as const,
    handler() {
      const dir = resolve(process.cwd(), "dist/server");
      if (!existsSync(resolve(dir, "index.mjs"))) return;
      writeFileSync(resolve(dir, "server.js"), PUENTE);
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

