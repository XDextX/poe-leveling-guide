/*
 * Coste de las gemas en el vendedor según su nivel requerido (tabla de PoE-newleague, de Blemming). Una sola tabla para
 * el precio de cada gema y para el texto de «Fuentes», que la explica. Sin datos del juego: la usa también el prerender.
 */

/** [nivel requerido por debajo del cual se aplica, moneda], de menor a mayor; la última vale para todo lo demás. */
const COST_TABLE: [below: number, currency: string][] = [
  [8, "Scroll of Wisdom"], [16, "Orb of Transmutation"], [28, "Orb of Alteration"], [38, "Orb of Chance"], [Infinity, "Orb of Alchemy"],
];

/** Moneda que cuesta una gema de ese nivel requerido. */
export const cost = (level: number): string => COST_TABLE.find(([below]) => level < below)![1];

/** Nombre corto de la moneda: "Orb of Alteration" → "Alteration". */
export const shortCurrency = (currency: string): string => currency.replace(/^(Orb of|Scroll of) /, "");

/** La tabla como texto: "menos de 8: Wisdom; 8-15: Transmutation; …; 38 o más: Alchemy". */
export const costTableText = (): string => COST_TABLE.map(([below, currency], i) => {
  const from = i ? COST_TABLE[i - 1][0] : 0;
  const range = !from ? `menos de ${below}` : below === Infinity ? `${from} o más` : `${from}-${below - 1}`;
  return `${range}: ${shortCurrency(currency)}`;
}).join("; ");
