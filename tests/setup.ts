/*
 * Arranque de las pruebas (npm test): en el navegador, gamedata/*.js dejan los datos del juego en window.DATA y src/js/data.ts
 * los lee de ahí. En Node no hay window, así que se crea con los mismos datos, leídos de public/gamedata/.
 */
import { readGameData } from "../scripts/lib/gamedata.mts";

(globalThis as unknown as { window: Window }).window = { DATA: readGameData(process.cwd()) } as Window;
