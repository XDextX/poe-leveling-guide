/* Enlaces de un único a sitios externos: la wiki y el comercio oficial. Solo arman la dirección; no piden nada. */

/** El nombre del único como lo conoce el juego: PoB antepone "Foulborn " a los mutados y añade a las Timeless Jewels su semilla y nodo ("Brutal Restraint 4948; 34.179; Wind Dancer"). */
export const plainUniqueName = (name: string): string => name.replace(/^Foulborn /, "").replace(/ \d+;.*$/, "");

/** Su página en la wiki de PoE, que cuenta cómo y dónde se consigue. */
export const wikiUrl = (name: string): string => "https://www.poewiki.net/wiki/" + encodeURI(plainUniqueName(name).replace(/ /g, "_"));

/**
 * Una búsqueda en el comercio oficial de la liga dada: ese único, por su nombre y su base, de vendedores conectados. Con `stats`
 * (identificadores de mods del comercio) solo salen los que los llevan, que es como se separa una variante de otra.
 */
export const tradeUrl = (league: string, name: string, base: string, stats: string[] = []): string => {
  const filters = stats.length ? [{ type: "and", filters: stats.map(id => ({ id })) }] : undefined;
  const query = { query: { name: plainUniqueName(name), type: base, status: { option: "online" }, ...(filters && { stats: filters }) } };
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(query))}`;
};
