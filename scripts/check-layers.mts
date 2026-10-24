// Regla de capas: la lógica (src/js/) no importa la interfaz (src/components/, src/app/, src/jsx/) ni toca la página
// (document, localStorage, window salvo window.DATA, por donde llegan los datos del juego). Falla si alguno lo hace.
// Uso: parte de npm run typecheck.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(import.meta.dirname, "..", "src", "js");
const DOM = /\b(?:document|localStorage|sessionStorage)\b|\bwindow\.(?!DATA\b)/;
const bad: string[] = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".ts"))) {
  const lines = fs.readFileSync(path.join(dir, f), "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = line.match(/^import .* from "([^"]+)";$/);
    if (m && /\/(components|app|jsx)\//.test(path.posix.join("/src/js/", m[1]))) bad.push(`src/js/${f}:${i + 1}: import "${m[1]}"`);
    // Los comentarios pueden nombrar la página; el código no.
    const code = line.replace(/\/\/.*$|\/\*.*?\*\/|^\s*\*.*$/g, "");
    if (DOM.test(code)) bad.push(`src/js/${f}:${i + 1}: ${code.trim()}`);
  });
}
if (bad.length) {
  console.error("La lógica (src/js/) no puede importar la interfaz ni tocar la página:\n  " + bad.join("\n  "));
  process.exitCode = 1;
}
