/* Filtros del comercio por mod: cómo se reconoce una línea de mod de PoB entre los mods del comercio oficial (sin DOM ni red). */

// Los números de una línea de mod: "30", "0.5" y los rangos con paréntesis de PoB, "(50-70)".
const NUMBER = /\(-?\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?\)|-?\d+(?:\.\d+)?/g;

/** La línea sin números ("+(50-70) to maximum Life" y "+# to maximum Life" → "+# to maximum Life"), y sin el "(Local)" que el comercio añade a algunos. */
export const normalizeMod = (text: string): string => text.replace(NUMBER, "#").replace(/ \(Local\)$/, "").replace(/\s+/g, " ").trim();

/**
 * Los identificadores del comercio de unas líneas de mod, sin repetir y como mucho `max`; las que el comercio no conoce se saltan.
 * Los que llevan "|" son mods con opciones (el comercio los pide con su valor aparte): no valen como filtro simple y se dejan.
 */
export function tradeFilters(mods: string[], table: Record<string, string>, max = 3): string[] {
  return [...new Set(mods.map(m => table[normalizeMod(m)]).filter(id => id && !id.includes("|")))].slice(0, max);
}
