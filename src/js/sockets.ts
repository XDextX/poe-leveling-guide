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

/** Las piezas del equipo que llevan gemas, con el nombre que les da PoB (el atributo slot de un grupo) y sus casillas según el nivel de objeto. */
const SLOTS: { name: string; es: string; sockets: (itemLevel: number) => number }[] = [
  { name: "Body Armour", es: "Pecho", sockets: maxSockets },
  { name: "Helmet", es: "Casco", sockets: l => Math.min(4, maxSockets(l)) },
  { name: "Gloves", es: "Guantes", sockets: l => Math.min(4, maxSockets(l)) },
  { name: "Boots", es: "Botas", sockets: l => Math.min(4, maxSockets(l)) },
  // Las armas cuentan como de una mano (3 casillas): la guía no sabe cuál lleva el jugador (una a dos manos daría más en el mejor caso).
  { name: "Weapon 1", es: "Arma 1", sockets: l => Math.min(3, maxSockets(l)) },
  { name: "Weapon 2", es: "Arma 2", sockets: l => Math.min(3, maxSockets(l)) },
];
/** Las casillas máximas de cada pieza del equipo con ese nivel de objeto, por el nombre de PoB. */
export const slotCapacities = (itemLevel: number): [slot: string, sockets: number][] => SLOTS.map(s => [s.name, s.sockets(itemLevel)]);
/** El nombre en español de una pieza (la que da PoB en slot). */
export const slotName = (slot: string): string => SLOTS.find(s => s.name === slot)?.es ?? slot;

/**
 * Reparte grupos de gemas (cada uno con su número de casillas enlazadas) entre las piezas del equipo con ese nivel de objeto. El
 * primero (la habilidad principal) elige antes y se queda con el pecho, que es la pieza con más enlaces; los demás van de mayor a
 * menor a la primera pieza donde quepan. Devuelve la pieza de cada grupo (el nombre de PoB) o null si no cabe (o si el grupo está vacío).
 */
export function assignSlots(sizes: number[], itemLevel: number): (string | null)[] {
  const left = new Map(SLOTS.map(s => [s.name, s.sockets(itemLevel)]));
  const out: (string | null)[] = sizes.map(() => null);
  const order = sizes.map((_, i) => i).sort((a, b) => (a === 0 ? -1 : b === 0 ? 1 : sizes[b] - sizes[a] || a - b));
  for (const i of order) {
    if (sizes[i] <= 0) continue;
    const slot = SLOTS.find(s => left.get(s.name)! >= sizes[i]);
    if (slot) { out[i] = slot.name; left.set(slot.name, left.get(slot.name)! - sizes[i]); }
  }
  return out;
}
