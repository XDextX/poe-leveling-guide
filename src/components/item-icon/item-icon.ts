/* Icono de un único, servido por el CDN de GGG a partir de la ruta de su arte (RePoE). */

import { UNIQUES } from "../../js/data";

/** Dirección del icono del único, o "" si RePoE no lo conoce. PoB antepone "Foulborn " a los mutados (se usa el arte del normal) y añade a las Timeless Jewels su semilla y nodo: "Brutal Restraint 4948; 34.179; Wind Dancer". */
export function uniqueIcon(name: string): string {
  const art = UNIQUES[name.replace(/^Foulborn /, "").replace(/ \d+;.*$/, "")];
  return art ? `https://web.poecdn.com/image/Art/${art[0]}.png?scale=1&w=${art[1]}&h=${art[2]}` : "";
}
