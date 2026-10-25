/* Una fila de la tabla de únicos: icono y nombre con su ficha, hueco y nivel requerido. */

import { slotEs } from "../../js/stats";
import { followCursor } from "../float-tip/float-tip";
import { uniqueIcon } from "../item-icon/item-icon";
import { UniqueTip } from "../unique-tip/unique-tip";

interface UniqueRowProps { item: Item }

/** Fila de un único. La ficha sale al pasar el ratón por el icono o el nombre y, con ratón, sigue al cursor; al tocar o con el teclado se queda bajo el objeto. */
export const UniqueRow: Component<UniqueRowProps, HTMLTableRowElement> = ({ item }) => {
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
    </tr>
  ) as HTMLTableRowElement;
};
