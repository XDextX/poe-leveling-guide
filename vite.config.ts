// Vite: npm run dev sirve la app con recarga en caliente; npm run build genera dist/ con un solo index.html (todo el JS y
// el CSS dentro, vite-plugin-singlefile), que funciona también abierto con doble clic. public/ se copia tal cual
// (iconos y public/gamedata/, los datos del juego). index.html es una plantilla con tres huecos que rellena el plugin
// prerender: el <head>, la página ya escrita (para buscadores y sin JavaScript) y los <script> de los datos.
/// <reference types="vitest/config" />
import fs from "node:fs";
import path from "node:path";
import { createServer, defineConfig, type Plugin, type UserConfig, type ViteDevServer } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { SITE, jsonLd, sitemap } from "./scripts/lib/site.mts";
import { gameDataFiles, readGameData, readGameDataMeta } from "./scripts/lib/gamedata.mts";

const root = import.meta.dirname;
const { date, license } = readGameDataMeta(root);

// Lo que comparten la app y el servidor que hace el prerender: el JSX va al runtime propio (src/jsx/), sin React.
const shared: UserConfig = {
  resolve: {
    alias: {
      "@app/jsx/jsx-runtime": path.join(root, "src/jsx/jsx-runtime.ts"),
      "@app/jsx/jsx-dev-runtime": path.join(root, "src/jsx/jsx-dev-runtime.ts"),
    },
  },
  oxc: { jsx: { runtime: "automatic", importSource: "@app/jsx" } },
};

/** Rellena los huecos de index.html ejecutando src/app/document.tsx en Node, y añade sitemap.xml al build. */
function prerender(): Plugin {
  let dev: ViteDevServer | undefined;
  return {
    name: "prerender",
    configureServer(server) { dev = server; },
    async transformIndexHtml(html) {
      // En dev se usa el propio servidor (ve los cambios al momento); en el build, uno temporal solo para esto.
      const server = dev ?? await createServer({ ...shared, configFile: false, root, logLevel: "error", appType: "custom", server: { middlewareMode: true, hmr: false } });
      try {
        const { prerender: render } = await server.ssrLoadModule("/src/app/document.tsx");
        const icon = "data:image/svg+xml," + encodeURIComponent(fs.readFileSync(path.join(root, "src/icon.svg"), "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim());
        const { head, page } = render({ site: SITE, jsonLd: jsonLd(), icon, classes: readGameData(root).CLASSES, date, license });
        // Funciones en los reemplazos: un "$" del contenido no debe leerse como patrón de String.replace.
        return html.replace("<!--app-head-->", () => head).replace("<!--app-page-->", () => page)
          .replace("<!--app-data-->", () => gameDataFiles().map(f => `<script src="${f}"></script>`).join("\n"));
      } finally {
        if (!dev) await server.close();
      }
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(date) });
    },
  };
}

/**
 * En dev, Vite mete el CSS desde JavaScript: al recargar se ve un momento la página sin estilos. Se oculta el cuerpo hasta que
 * main.tsx (con su CSS) se ha ejecutado; el script va después del suyo y los módulos se ejecutan en orden. En el build no hace
 * falta: el CSS ya va dentro del <head> del único index.html.
 */
function hideUnstyledInDev(): Plugin {
  return {
    name: "hide-unstyled-in-dev",
    apply: "serve",
    transformIndexHtml: () => [
      { tag: "style", attrs: { id: "unstyled" }, children: "body { visibility: hidden }", injectTo: "head-prepend" },
      { tag: "script", attrs: { type: "module" }, children: 'document.getElementById("unstyled")?.remove();', injectTo: "body" },
    ],
  };
}

export default defineConfig({
  ...shared,
  // Rutas relativas: la web vive en una subcarpeta de GitHub Pages y también se abre con doble clic.
  base: "./",
  // La fecha y la licencia las necesita la app para volver a crear <Sources> en el navegador.
  define: { PAGE_DATE: JSON.stringify(date), PAGE_LICENSE: JSON.stringify(license) },
  plugins: [prerender(), hideUnstyledInDev(), viteSingleFile()],
  build: { outDir: "dist", emptyOutDir: true },
  // npm test (Vitest): la lógica de src/js/ en Node, con los mismos imports y JSX que la app. tests/setup.ts pone los
  // datos del juego en window.DATA, como hacen gamedata/*.js en el navegador.
  test: { include: ["tests/**/*.test.ts"], setupFiles: ["tests/setup.ts"], environment: "node" },
});
