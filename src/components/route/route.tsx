/* La ruta de campaña: un desplegable por acto con sus pasos, notas y gemas. */

import { renderNote } from "../../js/route";
import { GemsBlock } from "../gem-line/gem-line";
import { Section } from "../section/section";
import "./route.css";

interface RouteSectionsProps {
  steps: PlannedStep[];
  /** Gemas que la clase ya tiene al empezar. */
  start: string[];
  /** Mostrar también los pasos sin gemas. */
  showZones: boolean;
}

/** La ruta, un desplegable por acto; sin "actividades de zona" solo quedan los pasos con gemas. */
export const RouteSections: Component<RouteSectionsProps, DocumentFragment> = ({ steps, start, showZones }) => {
  const acts = [...new Set(steps.map(s => s.act))];
  return (
    <>
      {acts.map(act => {
        const own = steps.filter(s => s.act === act), n = own.filter(s => s.gems.length).length;
        const count = n ? n + (n === 1 ? " paso con gemas" : " pasos con gemas") : "sin gemas";
        return (
          <Section title={<>Acto {act} <span>· {count}</span></>} className="act" open={act === 1} toc={{ id: "acto-" + act, label: String(act), group: "Ruta" }}>
            <ol class="route">
              {act === 1 && start.length > 0 && (
                <li class="has-gems"><div class="text">Al empezar</div><GemsBlock groups={[{ how: "Ya la tienes", ids: start }]} /></li>
              )}
              {own.filter(s => showZones || s.gems.length).map(s => (
                <li class={s.gems.length ? "has-gems" : undefined}>
                  {/* El texto y las notas son HTML que genera route.ts (zonas, misiones, flechas…), con los datos ya escapados. */}
                  <div class="text" html={s.text} />
                  {s.notes.length > 0 && <ul class="notes">{s.notes.map(note => <li html={renderNote(note)} />)}</ul>}
                  {s.gems.length > 0 && <GemsBlock groups={s.gems} />}
                </li>
              ))}
            </ol>
          </Section>
        );
      })}
    </>
  ) as DocumentFragment;
};
