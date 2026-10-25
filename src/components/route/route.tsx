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

/** Los pasos en bloques: cada paso que cambia de zona abre uno con los siguientes; los previos a la primera zona van sueltos. */
function blocks(steps: PlannedStep[]): PlannedStep[][] {
  const out: PlannedStep[][] = [];
  for (const s of steps) { if (s.zone || !out.length || !out.at(-1)![0].zone) out.push([s]); else out.at(-1)!.push(s); }
  return out;
}

interface StepProps { step: PlannedStep }

/** Las notas y gemas de un paso (el texto va aparte). */
const StepNotes: Component<StepProps, DocumentFragment> = ({ step }) => (
  <>
    {step.notes.length > 0 && <li class="zone-notes"><ul class="notes">{step.notes.map(note => <li html={renderNote(note)} />)}</ul></li>}
    {step.gems.length > 0 && <li class="has-gems"><GemsBlock groups={step.gems} /></li>}
  </>
) as DocumentFragment;

/** Un paso de la ruta. */
const StepItem: Component<StepProps, HTMLLIElement> = ({ step: s }) => (
  <li class={s.gems.length ? "has-gems" : undefined}>
    {/* El texto y las notas son HTML que genera route.ts (zonas, misiones, flechas…), con los datos ya escapados. */}
    <div class="text" html={s.text} />
    {s.notes.length > 0 && <ul class="notes">{s.notes.map(note => <li html={renderNote(note)} />)}</ul>}
    {s.gems.length > 0 && <GemsBlock groups={s.gems} />}
  </li>
) as HTMLLIElement;

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
              {blocks(own.filter(s => showZones || s.gems.length)).map(block => block.length === 1 && !block[0].zone ? <StepItem step={block[0]} /> : (
                <li class="zone">
                  <details open>
                    <summary class="text" html={block[0].text} />
                    <ol class="route zone-steps">
                      <StepNotes step={block[0]} />
                      {block.slice(1).map(s => <StepItem step={s} />)}
                    </ol>
                  </details>
                </li>
              ))}
            </ol>
          </Section>
        );
      })}
    </>
  ) as DocumentFragment;
};
