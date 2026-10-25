/* Icono de un único, servido por el CDN de GGG a partir de la ruta de su arte (RePoE). */

import { UNIQUES } from "../../js/data";

const iconUrl = ([art, w, h]: [string, number, number]): string => `https://web.poecdn.com/image/Art/${art}.png?scale=1&w=${w}&h=${h}`;

/** Dirección del icono de una gema (1×1), o "" si RePoE no conoce su arte. */
export const gemIcon = (art: string): string => art ? iconUrl([art, 1, 1]) : "";

/** Dirección del icono del único, o "" si RePoE no lo conoce. PoB antepone "Foulborn " a los mutados (se usa el arte del normal) y añade a las Timeless Jewels su semilla y nodo: "Brutal Restraint 4948; 34.179; Wind Dancer". */
export function uniqueIcon(name: string): string {
  const art = UNIQUES[name.replace(/^Foulborn /, "").replace(/ \d+;.*$/, "")];
  return art ? iconUrl(art) : "";
}
