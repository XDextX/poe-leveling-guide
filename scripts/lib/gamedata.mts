// Escribe los datos del juego ya reducidos en gamedata/, un archivo por tipo, que index.html carga con <script src>.
// <script src> (y no fetch de un .json) es lo que funciona también al abrir index.html con doble clic.
import fs from "node:fs";
import path from "node:path";

// Qué claves de DATA van en cada archivo, y en este orden se cargan.
const FILES: Record<string, (keyof GameDataRaw)[]> = { gems: ["G", "K"], campaign: ["CLASSES", "Q", "A", "START", "ROUTE"], tree: ["T"], items: ["U"] };
const DIR = "gamedata";

/** Escribe gamedata/<archivo>.js y devuelve sus rutas relativas, en orden de carga. */
export function writeGameData(root: string, data: GameDataRaw, date: string): string[] {
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  return Object.entries(FILES).map(([name, keys]) => {
    const part = Object.fromEntries(keys.map(k => [k, data[k]]));
    const file = `${DIR}/${name}.js`;
    fs.writeFileSync(path.join(root, file), `// Generado por scripts/build.mts con datos descargados el ${date}. No editar a mano.\nObject.assign(window.DATA ??= {}, ${JSON.stringify(part)});\n`);
    return file;
  });
}
