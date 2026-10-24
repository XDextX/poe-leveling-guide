/* Los datos del juego de esta página: los que dejan gamedata/*.js en window.DATA, ya con nombre (ver decode.ts). */

import { decodeGameData } from "./decode";

// Que estén todas las claves lo comprueba el arranque antes de cargar este módulo (src/app/guard.ts).
export const { CLASSES, ROUTE, START, GEMS, QUESTS, AREAS, SKILLS, NODES, EDGES, MASTERIES, CLASS_STARTS, SHEETS, UNIQUES } =
  decodeGameData(window.DATA as GameDataRaw);
