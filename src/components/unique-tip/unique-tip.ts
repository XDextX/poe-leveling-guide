/* Ficha de un único al estilo del juego, con los mods tal como los trae la build. */

/** Ficha: nombre, base, icono, nivel, implícitos y mods. `icon` es la dirección del icono, o "" si no hay. */
const uniqueTip: Component<[u: Item, icon: string], HTMLDivElement> = (u, icon) => {
  const block = (cls: string, lines: string[]) => lines.length ? [el("div", cls, "", ...lines.map(t => el("p", "", t)))] : [];
  return el("div", "utip", "",
    ...block("utip-head", [u.name, u.base]),
    ...(icon ? [Object.assign(el("img", "utip-icon"), { src: icon, alt: "" })] : []),
    ...block("utip-req", u.req ? [`Nivel requerido ${u.req}`] : []),
    ...block("utip-mods", u.mods.slice(0, u.implicits)),
    ...block("utip-mods", u.mods.slice(u.implicits)));
};
