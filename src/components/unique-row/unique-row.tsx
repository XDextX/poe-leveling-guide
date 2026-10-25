/* Una fila de la tabla de únicos: icono y nombre con su ficha, hueco y nivel requerido. */

import { slotEs } from "../../js/stats";
import { followCursor } from "../float-tip/float-tip";
import { tradeUrl, wikiUrl } from "../../js/unique-links";
import { uniqueIcon } from "../item-icon/item-icon";
import { UniqueTip } from "../unique-tip/unique-tip";

interface UniqueRowProps {
  item: Item;
  /** Liga en que se busca en el comercio. */
  league: string;
}

/** Fila de un único, con su precio (que rellena la tabla al pulsar "Ver precios") y enlaces a su wiki y a su búsqueda en el comercio. La ficha sale al pasar el ratón por el icono o el nombre y, con ratón, sigue al cursor; al tocar o con el teclado se queda bajo el objeto. */
export const UniqueRow: Component<UniqueRowProps, HTMLTableRowElement> = ({ item, league }) => {
  const icon = uniqueIcon(item.name);
  const tip = <UniqueTip item={item} icon={icon} /> as HTMLDivElement;
  const label = (
    <span class="item" tabIndex={0}>
      {/* Caja fija para el icono, haya o no: así los nombres quedan alineados. */}
      <span class="ico">{icon && <img src={icon} alt="" loading="lazy" />}</span>
      <span><b class="unique">{item.name}</b><small> {item.base}</small></span>
    </span>
  ) as HTMLSpanElement;
  followCursor(label, tip);
  return (
    <tr>
      <td>{label}{tip}</td>
      <td>{slotEs(item.slot)}</td>
      <td class="n">{item.req ? String(item.req) : "—"}</td>
      <td class="price n">—</td>
      <td class="links">
        <a href={wikiUrl(item.name)} target="_blank" rel="noopener noreferrer" title="Cómo y dónde se consigue, en la wiki de PoE">Wiki</a>
        {" · "}
        <a class="trade icon-btn" href={tradeUrl(league, item.name, item.base)} data-name={item.name} data-base={item.base} target="_blank" rel="noopener noreferrer"
          aria-label="Buscarlo en el comercio oficial" data-tip="Buscarlo en el comercio oficial, en tu liga"><span class="icon-scales" aria-hidden="true" /></a>
      </td>
    </tr>
  ) as HTMLTableRowElement;
};
