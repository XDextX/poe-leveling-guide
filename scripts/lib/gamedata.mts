// gamedata/: los datos del juego ya reducidos, un archivo por tipo, que index.html carga con <script src>, más la fecha de
// descarga y la licencia de exile-leveling. Va en el repositorio: así el build (y GitHub Actions) no necesita data/.
// <script src> (y no fetch de un .json) es lo que funciona también al abrir index.html con doble clic.
import fs from "node:fs";
import path from "node:path";

// Qué claves de DATA van en cada archivo, y en este orden se cargan.
const FILES: Record<string, (keyof GameDataRaw)[]> = { gems: ["G", "K"], campaign: ["CLASSES", "Q", "A", "START", "ROUTE"], tree: ["T"], items: ["U"] };
export const GAMEDATA_DIR = "gamedata";
const DATE_FILE = "downloaded.txt", LICENSE_FILE = "exile-leveling-LICENSE";

/** Rutas relativas de los archivos de datos (gamedata/<archivo>.js), en orden de carga. */
export const gameDataFiles = (): string[] => Object.keys(FILES).map(name => `${GAMEDATA_DIR}/${name}.js`);

/** Escribe gamedata/ (datos, fecha y licencia) bajo root y devuelve las rutas de los datos, en orden de carga. */
export function writeGameData(root: string, data: GameDataRaw, date: string, license: string): string[] {
  const dir = path.join(root, GAMEDATA_DIR);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, keys] of Object.entries(FILES)) {
    const part = Object.fromEntries(keys.map(k => [k, data[k]]));
    fs.writeFileSync(path.join(dir, `${name}.js`), `// Generado por scripts/gamedata.mts con datos descargados el ${date}. No editar a mano.\nObject.assign(window.DATA ??= {}, ${JSON.stringify(part)});\n`);
  }
  fs.writeFileSync(path.join(dir, DATE_FILE), date + "\n");
  fs.writeFileSync(path.join(dir, LICENSE_FILE), license);
  return gameDataFiles();
}

/** Fecha de descarga y licencia de exile-leveling guardadas en gamedata/. */
export function readGameDataMeta(root: string): { date: string; license: string } {
  const dir = path.join(root, GAMEDATA_DIR);
  return { date: fs.readFileSync(path.join(dir, DATE_FILE), "utf8").trim(), license: fs.readFileSync(path.join(dir, LICENSE_FILE), "utf8") };
}
