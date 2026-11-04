/* Mi leveling: el jugador edita los tramos que la guía le sugiere y se lleva el resultado como Loadouts de Path of Building. */

import { GEMS } from "../../js/data";
import { clearLeveling, defaultLeveling, fromOf, mergeStage, setPoints, setTo, splitStage, warnings } from "../../js/my-leveling";
import type { GuideData } from "../../js/guide";
import { isActive, isSupport } from "../../js/gems";
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

// Nombre en minúsculas → id de las gemas de habilidad y de soporte, para escribirlas en los campos con lista.
const byName = (ok: (id: string) => boolean): Map<string, string> => new Map(Object.keys(GEMS).filter(ok).map(id => [GEMS[id].name.toLowerCase(), id]));
const ACTIVE = byName(isActive), SUPPORT = byName(isSupport);
const names = (m: Map<string, string>): string[] => [...m.values()].map(id => GEMS[id].name).sort();

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

  /** Un campo de gema con lista: al elegir una llama a `pick` con su id (o "" si se vacía); si el nombre no existe lo dice bajo el campo. */
  const gemInput = (m: Map<string, string>, listId: string, field: string, label: string, pick: (id: string) => void, value: string) => {
    const error = <span class="field-error" role="alert" /> as HTMLElement, errorId = `my-err-${Math.random().toString(36).slice(2)}`;
    error.id = errorId;
    const input = <input type="text" list={listId} value={value} placeholder="Nombre de la gema" aria-label={label} data-field={field}
      onChange={() => {
        const text = input.value.trim(), id = m.get(text.toLowerCase());
        if (!text || id) { later(() => pick(id ?? "")); return; }
        input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", errorId);
        error.textContent = `No conozco una gema llamada «${text}».`;
      }} /> as HTMLInputElement;
    return <span class="gem-field">{input}{error}</span>;
  };

  const chips = (ids: string[], remove: (id: string) => void) => (
    <div class="chips">{ids.map(id => <span class="chip">{GEMS[id].name}<button type="button" aria-label={"Quitar " + GEMS[id].name} onClick={() => remove(id)}>×</button></span>)}</div>
  );

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
        <label class="field">Habilidad {gemInput(ACTIVE, "my-actives", "skill", `Habilidad del tramo ${n}`, id => edit(i, { skill: id || null }), s.skill ? GEMS[s.skill].name : "")}</label>
        <div class="field" role="group" aria-label={`Soportes del tramo ${n}`}>
          <span class="field-label">Soportes (los primeros, si tienes menos enlaces)</span>
          {chips(s.supports, id => { want = { stage: i, field: "support" }; edit(i, { supports: s.supports.filter(x => x !== id) }); })}
          {gemInput(SUPPORT, "my-supports", "support", `Añadir soporte al tramo ${n}`, id => { want = { stage: i, field: "support" }; if (id && !s.supports.includes(id)) edit(i, { supports: [...s.supports, id] }); }, "")}
        </div>
        <div class="field" role="group" aria-label={`Otras habilidades del tramo ${n}`}>
          <span class="field-label">Otras habilidades (auras, movimiento…)</span>
          {chips(s.others, id => { want = { stage: i, field: "other" }; edit(i, { others: s.others.filter(x => x !== id) }); })}
          {gemInput(ACTIVE, "my-actives", "other", `Añadir habilidad al tramo ${n}`, id => { want = { stage: i, field: "other" }; if (id && !s.others.includes(id)) edit(i, { others: [...s.others, id] }); }, "")}
        </div>
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
    if (target) (list.children[Math.min(target.stage, stages.length - 1)] as HTMLElement | undefined)?.querySelector<HTMLElement>(`[data-field="${target.field}"]`)?.focus();
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
      <datalist id="my-actives">{names(ACTIVE).map(n => <option value={n} />)}</datalist>
      <datalist id="my-supports">{names(SUPPORT).map(n => <option value={n} />)}</datalist>
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
