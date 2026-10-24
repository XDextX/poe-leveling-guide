/* Icono de un único, servido por el CDN de GGG a partir de la ruta de su arte (RePoE). */

/** Dirección del icono del único, o "" si RePoE no lo conoce. PoB antepone "Foulborn " a los mutados: se usa el arte del normal. */
function uniqueIcon(name: string): string {
  const art = UNIQUES[name.replace(/^Foulborn /, "")];
  return art ? `https://web.poecdn.com/image/Art/${art[0]}.png?scale=1&w=${art[1]}&h=${art[2]}` : "";
}
