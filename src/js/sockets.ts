/* Casillas que puede tener un objeto según su nivel (item level): el límite de enlaces que se puede recomendar en cada momento. */

// Nivel de objeto mínimo para tener 4, 5 y 6 casillas (wiki de PoE, "Item level"). Por debajo de 25 se supone un máximo de 3; es
// una aproximación, no un dato verificado de la tabla de la wiki.
const SOCKET_STEPS: [minItemLevel: number, sockets: number][] = [[50, 6], [35, 5], [25, 4]];
const LOW_LEVEL_SOCKETS = 3;

/** Casillas máximas de una armadura de pecho o un arma a dos manos con ese nivel de objeto; las demás piezas llegan a menos (ver socketBudget). */
export function maxSockets(itemLevel: number): number {
  return SOCKET_STEPS.find(([min]) => itemLevel >= min)?.[1] ?? LOW_LEVEL_SOCKETS;
}

/**
 * Casillas que da en total el equipo con ese nivel de objeto: el pecho y las armas a dos manos son las únicas piezas que pasan de
 * 4; casco, guantes y botas llegan a 4, y las armas a una mano y los escudos a 3. Las armas cuentan en su mejor caso (una a dos
 * manos o dos piezas de una mano), porque la guía no sabe cuál llevas. Anillos, amuletos y cinturón no tienen casillas.
 */
export function socketBudget(itemLevel: number): number {
  const chest = maxSockets(itemLevel), small = Math.min(4, chest), oneHanded = Math.min(3, chest);
  return chest + 3 * small + Math.max(chest, 2 * oneHanded);
}

/**
 * Reparte las casillas entre las habilidades del tramo por orden de importancia: cada entrada ocupa `size` casillas (la habilidad y,
 * en la principal, sus soportes). Las que ya no caben se vacían en su sitio y apuntan en `noRoom` cuál era. Va primero la principal.
 */
export function fitSockets(entries: { stage: StageSkill; size: number }[], budget: number): void {
  let used = 0;
  for (const { stage, size } of entries) {
    if (!stage.skill) continue;
    if (used + size <= budget) { used += size; continue; }
    stage.noRoom = stage.skill; stage.skill = null; stage.supports = [];
  }
}
