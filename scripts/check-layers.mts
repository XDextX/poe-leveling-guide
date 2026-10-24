// Regla de capas: la lógica (src/js/) no importa la interfaz (src/components/, src/app/, src/jsx/). Falla si alguno lo hace.
// Uso: parte de npm run typecheck.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(import.meta.dirname, "..", "src", "js");
const bad: string[] = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".ts"))) {
  for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/^import .* from "([^"]+)";$/gm))
    if (/\/(components|app|jsx)\//.test(path.posix.join("/src/js/", m[1]))) bad.push(`src/js/${f}: import "${m[1]}"`);
}
if (bad.length) {
  console.error("La lógica (src/js/) no puede importar la interfaz:\n  " + bad.join("\n  "));
  process.exitCode = 1;
}
