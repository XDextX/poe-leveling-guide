// public/gamedata/: los datos del juego ya reducidos, un archivo por tipo, que index.html carga con <script src>, más la
// fecha de descarga y la licencia de exile-leveling. Va en el repositorio: así el build (y GitHub Actions) no necesita data/.
// Vite copia public/ tal cual a dist/. <script src> (y no fetch de un .json) es lo que funciona también al abrir
// dist/index.html con doble clic.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Qué claves de DATA van en cada archivo, y en este orden se cargan.
const FILES: Record<string, (keyof GameDataRaw)[]> = { gems: ["G", "K"], campaign: ["CLASSES", "Q", "A", "START", "ROUTE"], tree: ["T"], items: ["U"] };
const DIR = path.join("public", "gamedata");
const DATE_FILE = "downloaded.txt", LICENSE_FILE = "exile-leveling-LICENSE";

/** Rutas de los archivos de datos en la web (gamedata/<archivo>.js), en orden de carga. */
export const gameDataFiles = (): string[] => Object.keys(FILES).map(name => `gamedata/${name}.js`);

/** Escribe public/gamedata/ (datos, fecha y licencia) bajo root y devuelve las rutas de los datos, en orden de carga. */
export function writeGameData(root: string, data: GameDataRaw, date: string, license: string): string[] {
  const dir = path.join(root, DIR);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, keys] of Object.entries(FILES)) {
    const part = Object.fromEntries(keys.map(k => [k, data[k]]));
    fs.writeFileSync(path.join(dir, `${name}.js`), `// Generado por scripts/gamedata.mts con datos descargados el ${date}. No editar a mano.\nObject.assign(window.DATA ??= {}, ${JSON.stringify(part)});\n`);
  }
  fs.writeFileSync(path.join(dir, DATE_FILE), date + "\n");
  fs.writeFileSync(path.join(dir, LICENSE_FILE), license);
  return gameDataFiles().map(f => path.join("public", f));
}

/** Fecha de descarga y licencia de exile-leveling guardadas en public/gamedata/. */
export function readGameDataMeta(root: string): { date: string; license: string } {
  const dir = path.join(root, DIR);
  return { date: fs.readFileSync(path.join(dir, DATE_FILE), "utf8").trim(), license: fs.readFileSync(path.join(dir, LICENSE_FILE), "utf8") };
}

/** Los datos del juego tal como los ve la app (window.DATA), cargando public/gamedata/ en un contexto aislado. */
export function readGameData(root: string): GameDataRaw {
  const ctx = vm.createContext({ window: {} as { DATA?: GameDataRaw } });
  for (const f of gameDataFiles()) vm.runInContext(fs.readFileSync(path.join(root, "public", f), "utf8"), ctx);
  return (ctx.window as { DATA: GameDataRaw }).DATA;
}
