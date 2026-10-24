/* Prioridad de stats en los raros: cuántas piezas llevan cada tipo de stat, en barras. */

import { gearStatCounts, slotEs } from "../../js/stats";
import "./rare-stats.css";

interface RareStatsProps { rares: Item[] }

/** Barras de stats de los raros, con la nota de qué piezas cuentan. */
export const RareStats: Component<RareStatsProps, DocumentFragment> = ({ rares }) => {
  const slots = [...new Set(rares.map(r => slotEs(r.slot)))].join(", ").toLowerCase();
  return (
    <>
      <p class="note">Cuántas de sus {rares.length} piezas raras ({slots}) llevan cada tipo de stat.</p>
      <ol class="stats">
        {gearStatCounts(rares).map(([label, n]) => (
          <li><span>{label}</span><span class="bar"><i style={`width:${n / rares.length * 100}%`} /></span><b>{`${n}/${rares.length}`}</b></li>
        ))}
      </ol>
    </>
  ) as DocumentFragment;
};
