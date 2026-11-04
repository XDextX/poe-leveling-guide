/* Mi leveling: el jugador edita los tramos que la guía le sugiere y se lleva el resultado como Loadouts de Path of Building. */

import { GEMS, SKILLS } from "../../js/data";
import { clearLeveling, defaultLeveling, fromOf, mergeStage, setPoints, setTo, slotLines, splitStage, warnings } from "../../js/my-leveling";
import type { GuideData } from "../../js/guide";
import { isActive, isSupport } from "../../js/gems";
import { GemIcon } from "../gem/gem";
import { focusQuietly, GemPicker } from "../gem-picker/gem-picker";
import { Section } from "../section/section";
import "./my-leveling.css";

interface MyLevelingProps {
  data: GuideData;
  /** Los tramos guardados antes (o los que traía el código de la build); sin ellos se parte de lo sugerido. */
  saved?: MyStage[];
  /** Si los tramos salen del código de PoB que se pegó y no de lo que el jugador guardó. */
  imported: boolean;
  /** Los tramos que había guardados antes de que el código pegado los sustituyera: permiten deshacerlo. */
  replaced?: MyStage[];
  /** Se llama con los tramos cada vez que el jugador cambia algo, para guardarlos. */
  onSave: (stages: MyStage[]) => void;
  /** El código de PoB (o su XML) con los tramos como Loadouts. */
  onExport: (stages: MyStage[], kind: "code" | "xml") => Promise<string>;
}

// Los datos traen gemas sin uso o sin traducir ("[UNUSED] Quick Block", "[DNT] …") y soportes sin datos de habilidad (no se sabe a qué apoyan): no se ofrecen.
const offered = Object.keys(GEMS).filter(id => !GEMS[id].name.startsWith("[") && Object.hasOwn(SKILLS, id));
const ACTIVE = offered.filter(isActive), SUPPORT = offered.filter(isSupport);

/** Un control de un tramo al que se devuelve el foco al redibujar: la posición del tramo y el campo (su data-field). */
interface Focus { stage: number; field: string }

/** Mi leveling: <MyLevelingSection data={data} imported={false} onSave={…} onExport={…} /> */
export const MyLevelingSection: Component<MyLevelingProps, HTMLDetailsElement> = ({ data, saved, imported, replaced, onSave, onExport }) => {
  const suggested = defaultLeveling(data);
  let stages: MyStage[] = saved?.length ? saved : suggested;
  /** Un nivel de deshacer: lo que había antes de lo último que descarta trabajo (unir, vaciar, restaurar, importar). */
  let undo: MyStage[] | null = imported && replaced?.length ? replaced : null;
  /** A dónde va el foco tras el próximo dibujo, si no es el control que lo tenía. */
  let want: Focus | null = null;
  const state = <p class="state" role="status" /> as HTMLElement, list = <div class="my-stages" /> as HTMLElement;
  const undoButton = <button type="button" class="undo" onClick={() => { if (!undo) return; const back = undo; undo = null; change(back); say("Deshecho."); }}>Deshacer</button> as HTMLButtonElement;
  const copyBox = <textarea class="copy-box" readonly hidden aria-label="Código para Path of Building" onFocus={(e: Event) => (e.target as HTMLTextAreaElement).select()} /> as HTMLTextAreaElement;
  const say = (text: string) => { state.textContent = text; undoButton.hidden = !undo; };
  const change = (next: MyStage[]) => { stages = next; onSave(stages); draw(); };
  /** Descarta trabajo: guarda lo de ahora para poder deshacerlo y cambia. */
  const discard = (next: MyStage[], message: string, focus?: Focus) => { undo = stages; want = focus ?? null; change(next); say(message); };
  const edit = (i: number, patch: Partial<MyStage>) => change(stages.map((s, j) => j === i ? { ...s, ...patch } : s));
  // Un cambio de un campo llega al salir de él: se dibuja después de que el foco llegue al siguiente, para devolverlo allí y no robarlo.
  const later = (fn: () => void) => setTimeout(fn, 0);

  /** Una gema como etiqueta con su dibujo y una × para quitarla; `field` identifica la × para devolverle el foco al redibujar. */
  const chip = (id: string, field: string, remove: () => void) => (
    <span class="chip"><GemIcon id={id} />{GEMS[id].name}<button type="button" data-field={field} aria-label={"Quitar " + GEMS[id].name} onClick={remove}>×</button></span>
  );
  // El cambio llega al salir del campo: se aplica después de que el foco llegue al siguiente, para devolverlo allí y no robarlo.
  const pick = (fn: (id: string) => void) => (id: string) => later(() => fn(id));

  function stageCard(s: MyStage, i: number): HTMLElement {
    const from = fromOf(stages, i), last = i === stages.length - 1, problems = warnings(s), n = i + 1;
    return (
      <div class="my-stage">
        <div class="stage-head">
          <h3>Tramo {n} · desde nv {from}</h3>
          <label class="until">hasta nv <input class="level" type="number" min={from} value={s.to} data-field="to" aria-label={`Último nivel del tramo ${n}`} onChange={(e: Event) => { const v = +(e.target as HTMLInputElement).value; later(() => change(setTo(stages, i, v))); }} /></label>
          <span class="acts">
            <button type="button" data-field="split" onClick={() => { want = { stage: i, field: "split" }; change(splitStage(stages, i)); }}>Dividir</button>
            {!last && <button type="button" data-field="merge" onClick={() => discard(mergeStage(stages, i), `Tramos ${n} y ${n + 1} unidos: se conservó el contenido del tramo ${n + 1} y se descartó el del ${n}.`, { stage: i, field: "merge" })}>Unir con el siguiente</button>}
          </span>
        </div>
        <div class="field" role="group" aria-label={`Habilidad del tramo ${n}`}>
          <span class="field-label">Habilidad</span>
          <GemPicker ids={ACTIVE} value={s.skill} label={`Habilidad del tramo ${n}`} field="skill" onPick={pick(id => edit(i, { skill: id || null }))} />
        </div>
        <div class="field" role="group" aria-label={`Soportes del tramo ${n}`}>
          <span class="field-label">Soportes (los primeros, si tienes menos enlaces)</span>
          <div class="chips">{s.supports.map((id, j) => chip(id, `support-x-${j}`, () => { want = { stage: i, field: "support" }; edit(i, { supports: s.supports.filter(x => x !== id) }); }))}</div>
          <GemPicker ids={SUPPORT} clearOnPick label={`Añadir soporte al tramo ${n}`} field="support" onPick={pick(id => { want = { stage: i, field: "support" }; if (id && !s.supports.includes(id)) edit(i, { supports: [...s.supports, id] }); })} />
        </div>
        <div class="field" role="group" aria-label={`Otras habilidades del tramo ${n}`}>
          <span class="field-label">Otras habilidades (auras, movimiento…), cada una con sus soportes</span>
          {s.others.map((o, k) => (
            <div class="other">
              <div class="chips">
                {chip(o.skill, `other-x-${k}`, () => { want = { stage: i, field: "other" }; edit(i, { others: s.others.filter((_, j) => j !== k) }); })}
                {o.supports.map((id, j) => chip(id, `other-support-${k}-x-${j}`, () => { want = { stage: i, field: `other-support-${k}` }; edit(i, { others: s.others.map((x, j) => j === k ? { ...x, supports: x.supports.filter(y => y !== id) } : x) }); }))}
              </div>
              <GemPicker ids={SUPPORT} clearOnPick label={`Añadir soporte a ${GEMS[o.skill].name} (tramo ${n})`} field={`other-support-${k}`}
                onPick={pick(id => { want = { stage: i, field: `other-support-${k}` }; if (id && !o.supports.includes(id)) edit(i, { others: s.others.map((x, j) => j === k ? { ...x, supports: [...x.supports, id] } : x) }); })} />
            </div>
          ))}
          <GemPicker ids={ACTIVE} clearOnPick label={`Añadir habilidad al tramo ${n}`} field="other" onPick={pick(id => { want = { stage: i, field: "other" }; if (id && !s.others.some(o => o.skill === id)) edit(i, { others: [...s.others, { skill: id, supports: [] }] }); })} />
        </div>
        {slotLines(s).length > 0 && (
          <div class="hint">En el equipo (objetos de nivel ≈{s.to}); así se escriben los grupos en PoB:
            <ul class="slots">{slotLines(s).map(line => <li>{line}</li>)}</ul>
          </div>
        )}
        {s.points === null
          ? <p class="hint">Árbol: el de tu build para este tramo (la app no lo puede cambiar).</p>
          : <label class="field">Puntos del árbol al acabar el tramo <input class="level" type="number" min="0" value={s.points} data-field="points" aria-label={`Puntos del árbol del tramo ${n}`} onChange={(e: Event) => { const v = +(e.target as HTMLInputElement).value; later(() => change(setPoints(stages, i, v))); }} /></label>}
        <label class="field">Nota <input type="text" value={s.note} data-field="note" placeholder="Ej.: cambia a Cleave al llegar al acto 2" aria-label={`Nota del tramo ${n}`} onChange={(e: Event) => { const v = (e.target as HTMLInputElement).value; later(() => edit(i, { note: v })); }} /></label>
        {problems.length > 0 && <ul class="warn">{problems.map(p => <li><b>Ojo:</b> {p}</li>)}</ul>}
      </div>
    ) as HTMLElement;
  }

  /** Redibuja los tramos y devuelve el foco: a donde se pidió o, si no, al mismo control del mismo tramo. */
  function draw(): void {
    const cur = document.activeElement as HTMLElement | null;
    const card = cur && list.contains(cur) ? cur.closest(".my-stage") : null;
    const target = want ?? (card && cur?.dataset.field ? { stage: [...list.children].indexOf(card), field: cur.dataset.field } : null);
    want = null;
    list.replaceChildren(...stages.map(stageCard));
    const field = target && (list.children[Math.min(target.stage, stages.length - 1)] as HTMLElement | undefined)?.querySelector<HTMLElement>(`[data-field="${target.field}"]`);
    if (field) focusQuietly(() => field.focus());
  }

  /** Entrega el código o el XML: copia el código al portapapeles (o lo muestra para copiarlo) y descarga el XML como archivo. */
  async function give(kind: "code" | "xml"): Promise<void> {
    let out: string;
    try { out = await onExport(stages, kind); } catch (e) { say("No he podido preparar el código: " + (e instanceof Error ? e.message : "error desconocido") + "."); return; }
    if (kind === "xml") {
      const link = <a download="mi-leveling.xml" href={URL.createObjectURL(new Blob([out], { type: "application/xml" }))} /> as HTMLAnchorElement;
      link.click(); URL.revokeObjectURL(link.href);
      say("XML descargado. Guárdalo en la carpeta Builds de Path of Building (Documentos\\Path of Building\\Builds) y ábrelo desde su lista.");
      return;
    }
    try {
      await navigator.clipboard.writeText(out);
      copyBox.hidden = true;
      say("Código copiado. En Path of Building: Import/Export Build → Import from clipboard. Cada tramo sale como un Loadout.");
    } catch {
      copyBox.value = out; copyBox.hidden = false; copyBox.focus();
      say("El navegador no me deja copiarlo solo: el código está en el campo de abajo, ya seleccionado; cópialo (Ctrl+C).");
    }
  }

  draw();
  say(imported ? "Estos tramos vienen del código que pegaste (sus Loadouts de PoB)." : saved?.length ? "Tus tramos, guardados en este navegador." : "Parte de lo que la guía sugiere; cámbialo a tu gusto. Se guarda solo.");
  return (
    <Section title="Mi leveling" className="act leveling my-leveling" toc={{ id: "my-leveling", label: "Mi leveling" }} open={false}>
      <p class="banner">Edita los tramos del leveling a tu manera: la habilidad y sus soportes, otras habilidades, cuántos puntos del árbol gastas y una nota. Luego llévatelo a Path of Building: cada tramo es un <b>Loadout</b> con su árbol y sus gemas.</p>
      <div class="toolbar">
        <button type="button" class="primary" onClick={() => void give("code")}>Copiar código para PoB</button>
        <button type="button" onClick={() => void give("xml")}>Descargar .xml</button>
        <button type="button" onClick={() => discard(suggested, "Has vuelto a lo que sugiere la guía; lo que tenías se puede recuperar.")}>Restaurar sugerencia</button>
        <button type="button" onClick={() => discard(clearLeveling(stages), "Tramos vaciados: rellénalos tú; lo que tenías se puede recuperar.")}>Vaciar</button>
      </div>
      <div class="status">{state}{undoButton}</div>
      {copyBox}
      {list}
    </Section>
  ) as HTMLDetailsElement;
};
