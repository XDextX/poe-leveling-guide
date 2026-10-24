/*
 * Arranque de las pruebas (npm test): en el navegador, gamedata/*.js dejan los datos del juego en window.DATA y src/js/data.ts
 * los lee de ahí. En Node no hay window, así que se crea con los mismos datos, leídos de public/gamedata/. Las pruebas que
 * piden un DOM (// @vitest-environment happy-dom) ya tienen window: ahí solo se añaden los datos.
 */
import { readGameData } from "../scripts/lib/gamedata.mts";

const g = globalThis as unknown as { window?: { DATA?: GameDataRaw } };
const DATA = readGameData(process.cwd());
if (g.window) g.window.DATA = DATA; else g.window = { DATA };
