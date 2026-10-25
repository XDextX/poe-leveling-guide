/* Casillas que puede tener un objeto según su nivel (item level): el límite de enlaces que se puede recomendar en cada momento. */

// Nivel de objeto mínimo para tener 4, 5 y 6 casillas (wiki de PoE, "Item level"). Por debajo de 25 se supone un máximo de 3; es
// una aproximación, no un dato verificado de la tabla de la wiki.
const SOCKET_STEPS: [minItemLevel: number, sockets: number][] = [[50, 6], [35, 5], [25, 4]];
const LOW_LEVEL_SOCKETS = 3;

/** Casillas máximas de una armadura de pecho (o arma a dos manos) con ese nivel de objeto. */
export function maxSockets(itemLevel: number): number {
  return SOCKET_STEPS.find(([min]) => itemLevel >= min)?.[1] ?? LOW_LEVEL_SOCKETS;
}
