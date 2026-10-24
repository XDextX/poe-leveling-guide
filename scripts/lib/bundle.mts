// Junta src/ en index.html: estilos, icono y código en línea; los datos del juego los carga de gamedata/ con <script src>.
// El código de src/ es TypeScript: aquí se le quitan los tipos con stripTypeScriptTypes, de Node, sin compilador. Por eso
// tsconfig.json exige erasableSyntaxOnly: solo vale TypeScript que se convierte en JS con solo borrar los tipos.
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { SITE, jsonLd, attr } from "./site.mts";

// Lógica sin interfaz (src/js/), en orden de carga: cada módulo puede usar lo que definen los anteriores.
const MODULES = ["data", "pob", "route", "plan", "stats", "suggest", "session"];
// Componentes de interfaz (src/components/<nombre>/<nombre>.{ts,css}). El orden también es el del CSS:
// leveling va después de gear porque su sección lleva las dos clases y .stagecard h3 debe ganar a .gear h3.
const COMPONENTS = ["section", "summary", "gem", "route", "other-ways", "gear", "leveling", "heatmap", "tree", "toc"];
// El arranque va al final: usa todo lo anterior y engancha el formulario.
const ENTRY = "js/app.ts";

interface BundleInput { dataFiles: string[]; date: string; license: string }

/** HTML final a partir de src/, con las rutas de los archivos de datos, la fecha de descarga y la licencia de exile-leveling. */
export function bundle(srcDir: string, { dataFiles, date, license }: BundleInput): string {
  const read = (f: string) => fs.readFileSync(path.join(srcDir, f), "utf8");
  const maybe = (f: string) => fs.existsSync(path.join(srcDir, f)) ? read(f) : "";
  const ts = (f: string) => stripTypeScriptTypes(read(f));
  const css = [read("styles.css"), ...COMPONENTS.map(c => maybe(`components/${c}/${c}.css`))].join("\n");
  const js = [...MODULES.map(m => ts(`js/${m}.ts`)), ...COMPONENTS.map(c => ts(`components/${c}/${c}.ts`)), ts(ENTRY)].join("\n");
  const scripts = dataFiles.map(f => `<script src="${f}"></script>`).join("\n");
  const icon = "data:image/svg+xml," + encodeURIComponent(read("icon.svg").replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim());
  // Funciones en los reemplazos: un "$" en el código o los datos no debe leerse como patrón de String.replace.
  return read("index.html").replace("<!--__DATA__-->", () => scripts).replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => js)
    .replace("__ICON__", () => icon).replaceAll("__DATE__", date)
    .replaceAll("__SITE__", () => SITE.url).replaceAll("__DESCRIPTION__", () => attr(SITE.description)).replace("__JSONLD__", () => jsonLd())
    .replace("__LICENSE__", () => license.replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;"));
}
