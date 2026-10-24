// Genera la web en dist/: index.html (src/ empaquetado), los datos de gamedata/, los archivos de public/ y sitemap.xml.
// Uso: npm run build   (solo lee el repositorio: para actualizar los datos, antes npm run data y npm run gamedata)
import fs from "node:fs";
import path from "node:path";
import { bundle } from "./lib/bundle.mts";
import { gameDataFiles, readGameDataMeta } from "./lib/gamedata.mts";
import { sitemap } from "./lib/site.mts";

const root = path.join(import.meta.dirname, ".."), dist = path.join(root, "dist");
const { date, license } = readGameDataMeta(root);
const dataFiles = gameDataFiles();

// dist/ se rehace entera: así no quedan archivos de builds anteriores.
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(root, "public"), dist, { recursive: true });
for (const f of dataFiles) fs.cpSync(path.join(root, f), path.join(dist, f));
fs.writeFileSync(path.join(dist, "index.html"), bundle(path.join(root, "src"), { dataFiles, date, license }));
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap(date));

const kb = (f: string) => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(0) + " KB";
console.log(`dist/ con datos del ${date}:`);
console.log(["index.html", ...dataFiles].map(f => `  ${f}: ${kb(f)}`).join("\n"));
