// Junta src/ en index.html: estilos, icono y código en línea; los datos del juego los carga de gamedata/ con <script src>.
const fs = require("fs"), path = require("path");

// Lógica sin interfaz (src/js/), en orden de carga: cada módulo puede usar lo que definen los anteriores.
const MODULES = ["data", "pob", "route", "plan", "stats", "suggest"];
// Componentes de interfaz (src/components/<nombre>/<nombre>.{js,css}). El orden también es el del CSS:
// leveling va después de gear porque su sección lleva las dos clases y .stagecard h3 debe ganar a .gear h3.
const COMPONENTS = ["section", "summary", "gem", "route", "other-ways", "gear", "leveling", "heatmap", "tree", "toc"];
// El arranque va al final: usa todo lo anterior y engancha el formulario.
const ENTRY = "js/app.js";

/** HTML final a partir de src/, con las rutas de los archivos de datos, la fecha de descarga y la licencia de exile-leveling. */
function bundle(srcDir, { dataFiles, date, license }) {
  const read = f => fs.readFileSync(path.join(srcDir, f), "utf8");
  const maybe = f => fs.existsSync(path.join(srcDir, f)) ? read(f) : "";
  const css = [read("styles.css"), ...COMPONENTS.map(c => maybe(`components/${c}/${c}.css`))].join("\n");
  const js = [...MODULES.map(m => read(`js/${m}.js`)), ...COMPONENTS.map(c => maybe(`components/${c}/${c}.js`)), read(ENTRY)].join("\n");
  const scripts = dataFiles.map(f => `<script src="${f}"></script>`).join("\n");
  const icon = "data:image/svg+xml," + encodeURIComponent(read("icon.svg").replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim());
  // Funciones en los reemplazos: un "$" en el código o los datos no debe leerse como patrón de String.replace.
  return read("index.html").replace("<!--__DATA__-->", () => scripts).replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => js)
    .replace("__ICON__", () => icon).replaceAll("__DATE__", date)
    .replace("__LICENSE__", () => license.replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;"));
}

module.exports = { bundle };
