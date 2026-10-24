/* Reglas sobre las gemas del juego. */

import { SKILLS } from "./data";

/** Gema de soporte: es la única que tiene tipos de habilidad a los que puede apoyar. */
export const isSupport = (id: string): boolean => (SKILLS[id]?.allowed.length ?? 0) > 0;
/** Gema de habilidad: conocida y no de soporte. */
export const isActive = (id: string): boolean => !!SKILLS[id] && !isSupport(id);
