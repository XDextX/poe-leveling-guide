/* La app: la página con sus eventos, la build leída y la guía, que se vuelve a componer cuando cambia una opción. */

import { CLASSES } from "../js/data";
import { isUserError, userError } from "../js/errors";
import { buildGuide } from "../js/guide";
import type { GuideData } from "../js/guide";
import { fromOf, sanitizeLeveling, stageNodes } from "../js/my-leveling";
import { decode, encode, exportLoadouts, parseBuild } from "../js/pob";
import { hideProgress, initProgress } from "../components/progress/progress";
import { initActGems, setActGems } from "../components/act-gems/act-gems-panel";
import { buildKey, doneStore, migrateKeys, setSuggested } from "../components/gem/gem";
import { Guide } from "../components/guide/guide";
import { setRedrawHeat } from "../components/heatmap/heatmap";
import { Page } from "../components/page/page";
import { hideToc, initToc, renderToc } from "../components/toc-nav/toc-nav";
import { startSession } from "./session";
import type { FormControls } from "./session";

const pickKey = (cls: string, build: Build): string => buildKey(cls, build) + ":eleccion";
const loadPicks = (key: string): Record<number, string> => { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? {}; } catch { return {}; } };

const levelingKey = (cls: string, build: Build): string => buildKey(cls, build) + ":mi-leveling";
const loadLeveling = (key: string): MyStage[] | undefined => { try { return sanitizeLeveling(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { return undefined; } };
const saveLeveling = (key: string, stages: MyStage[]): void => { try { localStorage.setItem(key, JSON.stringify(stages)); } catch {} };

const HOW_TO_COPY = "en Path of Building, Import/Export Build → Generate";

/**
 * La app entera: crea <Page> con sus eventos y guarda la build leída. main.tsx la pone en el documento en lugar de la
 * página prerenderizada, que es idéntica. Sin estado reactivo: cuando cambia algo, se vuelve a componer la guía.
 */
export const App: Component<{}, HTMLElement> = () => {
  /** La última build leída sin errores; null si no hay ninguna (campo vacío o código inválido). */
  let build: Build | null = null;
  /** La guía calculada de esa build y para qué clase y modo: si solo cambia "Actividades de zona", no se recalcula. */
  let computed: { cls: string; leagueStart: boolean; showSuggested: boolean; data: GuideData } | null = null;
  /** Las habilidades que el usuario eligió en cada tramo del leveling, por posición; se guardan por build y clase. */
  let picks: Record<number, string> = {};
  /** El XML del código pegado, para escribir "Mi leveling" en él; y si los tramos del editor salen de ese código (hasta que el jugador los cambie). */
  let xml = "", levelingFromCode = false;
  /** Los tramos que había guardados antes de que el código pegado los sustituyera, para poder deshacerlo. */
  let replacedLeveling: MyStage[] | undefined;
  /** Cuenta las lecturas: si se pulsa "Crear guía" otra vez antes de acabar, solo cuenta la última. */
  let reads = 0;
  /** Guarda la sesión ahora (lo da startSession); hasta que arranca no hay nada que guardar. */
  let saveSession: (() => void) | undefined;

  const page = <Page classes={CLASSES} date={PAGE_DATE} license={PAGE_LICENSE} onBuild={() => void run()} onOptionsChange={() => rerender()} /> as HTMLElement;
  // Los elementos de la propia página que hay que leer o cambiar.
  const find = <T extends HTMLElement = HTMLElement>(id: string): T => page.querySelector<T>("#" + id)!;
  const form: FormControls = { code: find("code"), cls: find("cls"), league: find("league"), zones: find("zones"), suggested: find("suggested") };
  const guide = find("out"), msg = find("msg");

  const say = (text: string, error = false) => { msg.className = error ? "error" : ""; msg.textContent = text; };
  const options = (): GuideOptions => ({ cls: form.cls.value, leagueStart: form.league.checked, showZones: form.zones.checked, showSuggested: form.suggested.checked });

  /** Compone la guía de la build actual con las opciones del formulario. */
  function rerender(): void {
    if (!build) return;
    const opts = options();
    migrateKeys(opts.cls, build);
    if (computed?.cls !== opts.cls || computed.leagueStart !== opts.leagueStart || computed.showSuggested !== opts.showSuggested) {
      picks = loadPicks(pickKey(opts.cls, build));
      computed = { cls: opts.cls, leagueStart: opts.leagueStart, showSuggested: opts.showSuggested, data: buildGuide(build, { ...opts, picks }) };
    }
    const { data } = computed;
    // Estado que leen los componentes de las gemas y del mapa de calor (TreeSection engancha el mapa nuevo).
    setSuggested(data.suggested);
    doneStore.load(opts.cls, build);
    setRedrawHeat(null);
    hideProgress();
    const key = levelingKey(opts.cls, build);
    const leveling = { saved: loadLeveling(key), imported: levelingFromCode, replaced: replacedLeveling, onSave: (stages: MyStage[]) => { levelingFromCode = false; saveLeveling(key, stages); }, onExport: exportLeveling };
    guide.replaceChildren(<Guide data={data} showZones={opts.showZones} showSuggested={opts.showSuggested} onPick={pickSkill} leveling={leveling} />);
    guide.hidden = false;
    setActGems(data, opts.showSuggested);
    renderToc();
  }

  /** Elige otra habilidad para un tramo: se guarda y se recompone la guía con ella (cambian sus soportes y las gemas que pide la ruta). */
  function pickSkill(stage: number, id: string): void {
    if (!build) return;
    const opts = options();
    picks = { ...picks, [stage]: id };
    try { localStorage.setItem(pickKey(opts.cls, build), JSON.stringify(picks)); } catch {}
    computed = null;
    rerender();
  }

  /** "Mi leveling" como código de PoB (o su XML), con un Loadout por tramo. */
  async function exportLeveling(stages: MyStage[], kind: "code" | "xml"): Promise<string> {
    if (!build || !computed) throw new Error("no hay build");
    const nodes = stageNodes(build, stages, computed.data.treesSuggested);
    const out = exportLoadouts(xml, stages.map((s, i) => ({ from: fromOf(stages, i), to: s.to, skill: s.skill, supports: s.supports, others: s.others, note: s.note, nodes: nodes[i] })));
    return kind === "xml" ? out : encode(out);
  }

  /** Sin guía (campo vacío o código inválido) tampoco hay índice; se vacía para que la anterior no siga viva. */
  function hideGuide(): void {
    setRedrawHeat(null);
    guide.replaceChildren();
    guide.hidden = true;
    setActGems(null);
    hideProgress();
    hideToc();
  }

  /** Lee el código del formulario y, si es válido, compone la guía. */
  async function run(): Promise<void> {
    const id = ++reads;
    say("");
    // Sin código válido no queda ninguna build: si no, cambiar una opción volvería a mostrar la anterior.
    build = computed = null;
    if (!form.code.value.trim()) { hideGuide(); say(`Primero pega el código de tu build: ${HOW_TO_COPY}.`); return; }
    let read: Build, text: string;
    // Solo leer el código va en el try: un fallo al dibujar la guía es un error de la app, no un código mal copiado.
    try {
      text = await decode(form.code.value);
      read = parseBuild(text);
      if (!read.gems.length) throw userError("la build no tiene gemas");
    } catch (e) {
      if (id !== reads) return;
      hideGuide();
      // Los errores del navegador (base64 o zlib inválidos) no dicen nada útil; los nuestros sí.
      const why = isUserError(e) ? e.message : "no tiene el formato de un código de Path of Building";
      say(`No he podido leer el código: ${why}. Cópialo de nuevo desde Path of Building, ${HOW_TO_COPY}.`, true);
      return;
    }
    if (id !== reads) return;
    build = read; xml = text;
    if (build.cls && CLASSES.includes(build.cls)) form.cls.value = build.cls;
    // Un código con los Loadouts de "Mi leveling" los trae al editor, en lugar de lo que hubiera guardado.
    const imported = sanitizeLeveling(build.leveling);
    levelingFromCode = !!imported; replacedLeveling = undefined;
    if (imported) {
      migrateKeys(form.cls.value, build);
      const key = levelingKey(form.cls.value, build);
      replacedLeveling = loadLeveling(key);
      saveLeveling(key, imported);
    }
    rerender();
    saveSession?.();
    say(`Build leída: ${build.gems.length} gemas.`);
  }

  say("Pega el código de tu build y pulsa Crear guía.");
  // Lo que necesita la página ya en el documento (como un useEffect): main.tsx la monta justo al volver de aquí.
  queueMicrotask(() => {
    initToc();
    initActGems();
    initProgress();
    void startSession({ form, guide, run, rerender }).then(save => { saveSession = save; });
  });
  return page;
};
