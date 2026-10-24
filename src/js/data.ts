/* Los datos del juego de esta página: los que dejan gamedata/*.js en window.DATA, ya con nombre (ver decode.ts). */

import { decodeGameData } from "./decode";

// Que estén todas las claves lo comprueba el arranque antes de cargar este módulo (src/app/guard.ts).
export const { CLASSES, ROUTE, START, GEMS, QUESTS, AREAS, SKILLS, NODES, EDGES, MASTERIES, CLASS_STARTS, SHEETS, UNIQUES } =
  decodeGameData(window.DATA as GameDataRaw);

export const NODE = { SMALL: 0, NOTABLE: 1, KEYSTONE: 2, MASTERY: 3, JEWEL: 4, START: 5 } as const;

/** Coste en el vendedor según el nivel requerido de la gema. */
export const cost = (level: number): string => level < 8 ? "Scroll of Wisdom" : level < 16 ? "Orb of Transmutation" : level < 28 ? "Orb of Alteration" : level < 38 ? "Orb of Chance" : "Orb of Alchemy";
