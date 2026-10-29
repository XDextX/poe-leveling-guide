/*
 * "Mi avance": en qué acto estás, cuántas gemas llevas de las que da la ruta y cuáles te faltan, a partir de las casillas de "conseguida".
 * Sale como sección de la guía y como resumen siempre a la vista: en la columna derecha si cabe y, si no, en un panel que abre el botón
 * "Avance" (como el índice). initProgress engancha ese botón; hideProgress oculta el resumen.
 */

import { pendingGems, progressByAct } from "../../js/progress";
import { doneStore } from "../gem/gem";
import { GemLine } from "../gem-line/gem-line";
import { Section, Subhead } from "../section/section";
import "./progress.css";

const ACTS = 10;
// Acto en que dices estar, por build y clase (la misma clave que las gemas conseguidas).
const actKey = () => doneStore.key + ":acto";
const savedAct = (): number => { try { return Math.min(ACTS, Math.max(1, +(localStorage.getItem(actKey()) ?? 1) || 1)); } catch { return 1; } };

interface ProgressBodyProps { plan: Plan; act: number }

/** El contenido de "Mi avance" para un acto: el total, una barra por acto y las gemas que faltan. */
const ProgressBody: Component<ProgressBodyProps, DocumentFragment> = ({ plan, act }) => {
  const byAct = progressByAct(plan, doneStore.ids);
  const total = byAct.reduce((n, a) => n + a.total, 0), done = byAct.reduce((n, a) => n + a.done, 0);
  const before = pendingGems(plan, doneStore.ids, 1, act - 1), now = pendingGems(plan, doneStore.ids, act, act);
  const lines = (groups: ReturnType<typeof pendingGems>) => groups.map(g => <GemLine how={`Acto ${g.act} · ${g.quest}`} ids={g.ids} />);
  return (
    <>
      <p class="prog-total"><b>{done}</b> de <b>{total}</b> gemas conseguidas <progress value={done} max={total} /></p>
      <div class="prog-acts">
        {byAct.map(a => <span class={a.act === act ? "now" : a.act < act && a.done < a.total ? "late" : undefined}>Acto {a.act}: <b>{a.done}/{a.total}</b></span>)}
      </div>
      {before.length > 0 && <><Subhead>Te faltan de actos anteriores</Subhead>{lines(before)}</>}
      {now.length > 0 && <><Subhead>Ahora, en el acto {act}</Subhead>{lines(now)}</>}
      {before.length + now.length === 0 && <p class="note">Llevas todo lo que da la ruta hasta el acto {act}.</p>}
    </>
  ) as DocumentFragment;
};

const mini = () => document.getElementById("progress-mini")!;
const miniButton = () => document.getElementById("progress-toggle")!;

interface MiniProps { plan: Plan; act: number; onPick: (e: Event) => void }

/** El resumen corto: el acto, el total, cuántas gemas van atrasadas y cómo llegar al detalle. */
const ProgressMini: Component<MiniProps, DocumentFragment> = ({ plan, act, onPick }) => {
  const byAct = progressByAct(plan, doneStore.ids);
  const total = byAct.reduce((n, a) => n + a.total, 0), done = byAct.reduce((n, a) => n + a.done, 0);
  const late = pendingGems(plan, doneStore.ids, 1, act - 1).reduce((n, g) => n + g.ids.length, 0);
  return (
    <>
      <b class="prog-title">Mi avance</b>
      <label class="prog-pick">Estoy en el acto{" "}
        <select onChange={onPick}>{Array.from({ length: ACTS }, (_, i) => <option value={String(i + 1)} selected={i + 1 === act}>{i + 1}</option>)}</select>
      </label>
      <p class="prog-total"><b>{done}</b>/<b>{total}</b> gemas <progress value={done} max={total} /></p>
      {late > 0 && <span class="prog-late">{late} {late === 1 ? "atrasada" : "atrasadas"} de actos anteriores</span>}
      <button class="prog-detail" onClick={goToDetail}>Ver detalle</button>
    </>
  ) as DocumentFragment;
};

/** Lleva a la sección completa, desplegándola, y cierra el panel flotante en pantalla estrecha. */
function goToDetail(): void {
  const section = document.getElementById("avance");
  if (section instanceof HTMLDetailsElement) section.open = true;
  setMiniOpen(false);
  section?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

/** Abre o cierra el resumen como panel (solo se nota en pantalla estrecha: en ancha va fijo en la columna). */
function setMiniOpen(open: boolean): void {
  mini().classList.toggle("open", open);
  miniButton().setAttribute("aria-expanded", String(open));
}

/** Oculta el resumen y su botón: sin guía no hay avance que enseñar. */
export function hideProgress(): void {
  mini().hidden = miniButton().hidden = true;
  setMiniOpen(false);
}

let initialized = false;
/** Engancha el botón "Avance" y el cierre del panel con un clic fuera o Escape; lo llama el arranque una sola vez. */
export function initProgress(): void {
  if (initialized) return;
  initialized = true;
  miniButton().addEventListener("click", () => setMiniOpen(!mini().classList.contains("open")));
  addEventListener("keydown", e => { if (e.key === "Escape") setMiniOpen(false); });
  addEventListener("click", e => { if (!(e.target as Element).closest("#progress-mini, #progress-toggle")) setMiniOpen(false); });
}

interface ProgressSectionProps { plan: Plan }

// Solo se escucha la guía vigente: al componer otra, la anterior deja de recibir avisos.
let stopListening: (() => void) | null = null;

/** Sección "Mi avance": el selector de acto y su resumen, que se actualiza al marcar gemas en cualquier parte de la guía. */
export const ProgressSection: Component<ProgressSectionProps, HTMLDetailsElement> = ({ plan }) => {
  let act = savedAct();
  const body = <div class="prog-body" /> as HTMLDivElement;
  const pick = (e: Event) => { act = +(e.target as HTMLSelectElement).value; try { localStorage.setItem(actKey(), String(act)); } catch {} fill(); };
  const fill = () => {
    // El selector de la sección se crea una vez; si el acto se cambió desde el resumen, se pone al día.
    section.querySelector<HTMLSelectElement>(".prog-pick select")!.value = String(act);
    body.replaceChildren(<ProgressBody plan={plan} act={act} />);
    mini().replaceChildren(<ProgressMini plan={plan} act={act} onPick={pick} />);
  };
  const section = (
    <Section title="Mi avance" className="act progress" toc={{ id: "avance", label: "Mi avance" }}>
      <label class="prog-pick">Estoy en el acto{" "}
        <select onChange={pick}>
          {Array.from({ length: ACTS }, (_, i) => <option value={String(i + 1)} selected={i + 1 === act}>{i + 1}</option>)}
        </select>
      </label>
      {body}
    </Section>
  ) as HTMLDetailsElement;
  fill();
  mini().hidden = miniButton().hidden = false;
  stopListening?.();
  stopListening = doneStore.onChange(fill);
  return section;
};
