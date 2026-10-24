/* Tabla de los únicos de la build, por nivel requerido, con su icono y su ficha. */

import { slotEs } from "../../js/stats";
import { placeTip } from "../float-tip/float-tip";
import { uniqueIcon } from "../item-icon/item-icon";
import { UniqueTip } from "../unique-tip/unique-tip";
import "./unique-table.css";

interface UniqueTableProps { uniques: Item[] }

/** Tabla de únicos. Con ratón la ficha sigue al cursor; al tocar o con el teclado se queda bajo el objeto. */
export const UniqueTable: Component<UniqueTableProps, HTMLTableElement> = ({ uniques }) => {
  const follow = (e: MouseEvent) => {
    const tip = (e.target as Element).closest("tr")?.querySelector<HTMLElement>(".utip"); if (!tip) return;
    tip.style.position = "fixed";
    placeTip(tip, e.clientX, e.clientY, innerWidth, innerHeight, 16);
  };
  const reset = (e: MouseEvent) => (e.currentTarget as Element).querySelectorAll<HTMLElement>(".utip").forEach(t => t.style.cssText = "");
  return (
    <table class="uniques">
      <thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th></tr></thead>
      <tbody onMousemove={follow} onMouseleave={reset}>
        {uniques.map(u => {
          const icon = uniqueIcon(u.name);
          return (
            <tr>
              <td>
                <span class="item" tabIndex={0}>
                  {/* Caja fija para el icono, haya o no: así los nombres quedan alineados. */}
                  <span class="ico">{icon && <img src={icon} alt="" loading="lazy" />}</span>
                  <span><b class="unique">{u.name}</b><small> {u.base}</small></span>
                </span>
                <UniqueTip item={u} icon={icon} />
              </td>
              <td>{slotEs(u.slot)}</td>
              <td class="n">{u.req ? String(u.req) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ) as HTMLTableElement;
};
