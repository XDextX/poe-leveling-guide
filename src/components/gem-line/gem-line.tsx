/* Líneas de gemas ("cómo · gemas · nota") y el bloque de gemas de un paso de la ruta. */

import { Gem, costText } from "../gem/gem";
import "./gem-line.css";

interface GemLineProps {
  /** Cómo se consigue ("Recompensa", "Comprar a Nessa"…). */
  how: string;
  ids: string[];
  withCost?: boolean;
  /** Nota al final, como el coste o "Cambia a … desde nv …". */
  note?: string;
}

/** Línea "cómo · gemas · nota": la usan los pasos de la ruta y las tarjetas de leveling. */
export const GemLine: Component<GemLineProps, HTMLDivElement> = ({ how, ids, withCost = false, note }) => (
  <div class="line">
    <span class="how">{how}</span>
    {ids.map(id => <Gem id={id} withCost={withCost} />)}
    {note && <span class="cost">{note}</span>}
  </div>
) as HTMLDivElement;

interface GemsBlockProps { groups: GemGroup[] }

/** Bloque de gemas de un paso: una línea por recompensa o vendedor; las compras llevan su coste. */
export const GemsBlock: Component<GemsBlockProps, HTMLDivElement> = ({ groups }) => (
  <div class="gems">
    {groups.map(g => <GemLine how={g.how} ids={g.ids} withCost={!!g.buy} note={g.buy ? `Coste: ${costText(g.ids)}` : ""} />)}
  </div>
) as HTMLDivElement;
