/* Ficha de un único al estilo del juego, con los mods tal como los trae la build. */

import "./unique-tip.css";

interface UniqueTipProps {
  item: Item;
  /** Dirección del icono, o "" si no hay. */
  icon: string;
}

/** Bloque de la ficha con una línea por texto, o nada si no hay textos. */
const tipBlock = (className: string, lines: string[]) => lines.length > 0 && <div class={className}>{lines.map(t => <p>{t}</p>)}</div>;

/** Ficha: nombre, base, icono, nivel, implícitos y mods. */
export const UniqueTip: Component<UniqueTipProps, HTMLDivElement> = ({ item, icon }) => (
  <div class="utip">
    {tipBlock("utip-head", [item.name, item.base])}
    {icon && <img class="utip-icon" src={icon} alt="" />}
    {tipBlock("utip-req", item.req ? [`Nivel requerido ${item.req}`] : [])}
    {tipBlock("utip-mods", item.mods.slice(0, item.implicits))}
    {tipBlock("utip-mods", item.mods.slice(item.implicits))}
  </div>
) as HTMLDivElement;
