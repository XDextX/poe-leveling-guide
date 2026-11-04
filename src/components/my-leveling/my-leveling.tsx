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
  /** Se llama con los tramos cada vez que el jugador cambia algo, para guardarlos. */
  onSave: (stages: MyStage[]) => void;
  /** El código de PoB (o su XML) con los tramos como Loadouts. */
  onExport: (stages: MyStage[], kind: "code" | "xml") => Promise<string>;
}

// Nombre en minúsculas → id de las gemas de habilidad y de soporte, para escribirlas en los campos con lista.
const byName = (ok: (id: string) => boolean): Map<string, string> => new Map(Object.keys(GEMS).filter(ok).map(id => [GEMS[id].name.toLowerCase(), id]));
const ACTIVE = byName(isActive), SUPPORT = byName(isSupport);
const names = (m: Map<string, string>): string[] => [...m.values()].map(id => GEMS[id].name).sort();

/** Mi leveling: <MyLevelingSection data={data} imported={false} onSave={…} onExport={…} /> */
export const MyLevelingSection: Component<MyLevelingProps, HTMLDetailsElement> = ({ data, saved, imported, onSave, onExport }) => {
  const suggested = defaultLeveling(data);
  let stages: MyStage[] = saved?.length ? saved : suggested;
  const state = <p class="state" /> as HTMLElement, list = <div class="my-stages" /> as HTMLElement;
  const say = (text: string) => { state.textContent = text; };
  const change = (next: MyStage[]) => { stages = next; onSave(stages); draw(); };
  const edit = (i: number, patch: Partial<MyStage>) => change(stages.map((s, j) => j === i ? { ...s, ...patch } : s));

  /** Un campo de gema con lista: al elegir una llama a `pick` con su id (o "" si se vacía); si el nombre no existe lo dice. */
  const gemInput = (m: Map<string, string>, listId: string, pick: (id: string) => void, value: string, label: string) => (
    <input type="text" list={listId} value={value} placeholder="Nombre de la gema" aria-label={label}
      onChange={(e: Event) => {
        const field = e.target as HTMLInputElement, text = field.value.trim(), id = m.get(text.toLowerCase());
        if (!text) pick("");
        else if (id) pick(id);
        else { say(`No conozco una gema llamada «${text}».`); field.value = value; }
      }} />
  );

  const chips = (ids: string[], remove: (id: string) => void) => (
    <div class="chips">{ids.map(id => <span class="chip">{GEMS[id].name}<button type="button" aria-label={"Quitar " + GEMS[id].name} onClick={() => remove(id)}>×</button></span>)}</div>
  );

  function stageCard(s: MyStage, i: number): HTMLElement {
    const from = fromOf(stages, i), last = i === stages.length - 1, problems = warnings(s);
    return (
      <div class="my-stage">
        <h3>
          Tramo {i + 1} · nv {from}–
          <input class="level" type="number" min={from} value={s.to} aria-label={`Último nivel del tramo ${i + 1}`} onChange={(e: Event) => change(setTo(stages, i, +(e.target as HTMLInputElement).value))} />
          <span class="acts">
            <button type="button" onClick={() => change(splitStage(stages, i))}>Dividir</button>
            {!last && <button type="button" onClick={() => change(mergeStage(stages, i))}>Unir con el siguiente</button>}
          </span>
        </h3>
        <label>Habilidad {gemInput(ACTIVE, "my-actives", id => edit(i, { skill: id || null, supports: id ? s.supports : [] }), s.skill ? GEMS[s.skill].name : "", "Habilidad")}</label>
        <label>Soportes (los primeros, si tienes menos enlaces)
          {chips(s.supports, id => edit(i, { supports: s.supports.filter(x => x !== id) }))}
          {gemInput(SUPPORT, "my-supports", id => id && !s.supports.includes(id) && edit(i, { supports: [...s.supports, id] }), "", "Añadir soporte")}
        </label>
        <label>Otras habilidades (auras, movimiento…)
          {chips(s.others, id => edit(i, { others: s.others.filter(x => x !== id) }))}
          {gemInput(ACTIVE, "my-actives", id => id && !s.others.includes(id) && edit(i, { others: [...s.others, id] }), "", "Añadir habilidad")}
        </label>
        {s.points === null
          ? <p class="hint">Árbol: el de tu build para este tramo (la app no lo puede cambiar).</p>
          : <label>Puntos del árbol al acabar el tramo <input class="level" type="number" min="0" value={s.points} onChange={(e: Event) => change(setPoints(stages, i, +(e.target as HTMLInputElement).value))} /></label>}
        <label>Nota <input type="text" value={s.note} placeholder="Ej.: cambia a Cleave al llegar al acto 2" onChange={(e: Event) => edit(i, { note: (e.target as HTMLInputElement).value })} /></label>
        {problems.length > 0 && <ul class="warn">{problems.map(p => <li>{p}</li>)}</ul>}
      </div>
    ) as HTMLElement;
  }

  function draw(): void { list.replaceChildren(...stages.map(stageCard)); }

  /** Entrega el código o el XML: copia el código al portapapeles y descarga el XML como archivo. */
  async function give(kind: "code" | "xml"): Promise<void> {
    try {
      const out = await onExport(stages, kind);
      if (kind === "code") { await navigator.clipboard.writeText(out); say("Código copiado. En Path of Building: Import/Export Build → Import from clipboard. Cada tramo sale como un Loadout."); return; }
      const link = <a download="mi-leveling.xml" href={URL.createObjectURL(new Blob([out], { type: "application/xml" }))} /> as HTMLAnchorElement;
      link.click(); URL.revokeObjectURL(link.href);
      say("XML descargado. Guárdalo en la carpeta Builds de Path of Building (Documentos\\Path of Building\\Builds) y ábrelo desde su lista.");
    } catch (e) { say("No he podido preparar el código: " + (e instanceof Error ? e.message : "error desconocido") + "."); }
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
        <button type="button" onClick={() => { change(suggested); say("Vuelves a lo que sugiere la guía."); }}>Restaurar sugerencia</button>
        <button type="button" onClick={() => { change(clearLeveling(stages)); say("Tramos vacíos: rellénalos tú."); }}>Vaciar</button>
      </div>
      {state}
      {list}
    </Section>
  ) as HTMLDetailsElement;
};
