/* La app: la página con sus eventos, la build leída y la guía, que se vuelve a componer cuando cambia una opción. */

import { CLASSES } from "../js/data";
import { isUserError, userError } from "../js/errors";
import { buildGuide } from "../js/guide";
import type { GuideData } from "../js/guide";
import { decode, parseBuild } from "../js/pob";
import { initActGems, setActGems } from "../components/act-gems/act-gems-panel";
import { doneStore, setSuggested } from "../components/gem/gem";
import { Guide } from "../components/guide/guide";
import { setRedrawHeat } from "../components/heatmap/heatmap";
import { Page } from "../components/page/page";
import { hideToc, initToc, renderToc } from "../components/toc-nav/toc-nav";
import { startSession } from "./session";
import type { FormControls } from "./session";

const HOW_TO_COPY = "en Path of Building, Import/Export Build → Generate";

/**
 * La app entera: crea <Page> con sus eventos y guarda la build leída. main.tsx la pone en el documento en lugar de la
 * página prerenderizada, que es idéntica. Sin estado reactivo: cuando cambia algo, se vuelve a componer la guía.
 */
export const App: Component<{}, HTMLElement> = () => {
  /** La última build leída sin errores; null si no hay ninguna (campo vacío o código inválido). */
  let build: Build | null = null;
  /** La guía calculada de esa build y para qué clase y modo: si solo cambia "Actividades de zona", no se recalcula. */
  let computed: { cls: string; leagueStart: boolean; data: GuideData } | null = null;
  /** Cuenta las lecturas: si se pulsa "Crear guía" otra vez antes de acabar, solo cuenta la última. */
  let reads = 0;

  const page = <Page classes={CLASSES} date={PAGE_DATE} license={PAGE_LICENSE} onBuild={() => void run()} onOptionsChange={() => rerender()} /> as HTMLElement;
  // Los elementos de la propia página que hay que leer o cambiar.
  const find = <T extends HTMLElement = HTMLElement>(id: string): T => page.querySelector<T>("#" + id)!;
  const form: FormControls = { code: find("code"), cls: find("cls"), league: find("league"), zones: find("zones") };
  const guide = find("out"), msg = find("msg");

  const say = (text: string, error = false) => { msg.className = error ? "error" : ""; msg.textContent = text; };
  const options = (): GuideOptions => ({ cls: form.cls.value, leagueStart: form.league.checked, showZones: form.zones.checked });

  /** Compone la guía de la build actual con las opciones del formulario. */
  function rerender(): void {
    if (!build) return;
    const opts = options();
    if (computed?.cls !== opts.cls || computed.leagueStart !== opts.leagueStart) computed = { cls: opts.cls, leagueStart: opts.leagueStart, data: buildGuide(build, opts) };
    const { data } = computed;
    // Estado que leen los componentes de las gemas y del mapa de calor (TreeSection engancha el mapa nuevo).
    setSuggested(data.suggested);
    doneStore.load(opts.cls, build);
    setRedrawHeat(null);
    guide.replaceChildren(<Guide data={data} showZones={opts.showZones} />);
    guide.hidden = false;
    setActGems(data);
    renderToc();
  }

  /** Sin guía (campo vacío o código inválido) tampoco hay índice; se vacía para que la anterior no siga viva. */
  function hideGuide(): void {
    setRedrawHeat(null);
    guide.replaceChildren();
    guide.hidden = true;
    setActGems(null);
    hideToc();
  }

  /** Lee el código del formulario y, si es válido, compone la guía. */
  async function run(): Promise<void> {
    const id = ++reads;
    say("");
    // Sin código válido no queda ninguna build: si no, cambiar una opción volvería a mostrar la anterior.
    build = computed = null;
    if (!form.code.value.trim()) { hideGuide(); say(`Primero pega el código de tu build: ${HOW_TO_COPY}.`); return; }
    let read: Build;
    // Solo leer el código va en el try: un fallo al dibujar la guía es un error de la app, no un código mal copiado.
    try {
      read = parseBuild(await decode(form.code.value));
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
    build = read;
    if (build.cls && CLASSES.includes(build.cls)) form.cls.value = build.cls;
    rerender();
    say(`Build leída: ${build.gems.length} gemas.`);
  }

  say("Pega el código de tu build y pulsa Crear guía.");
  // Lo que necesita la página ya en el documento (como un useEffect): main.tsx la monta justo al volver de aquí.
  queueMicrotask(() => {
    initToc();
    initActGems();
    void startSession({ form, guide, run, rerender });
  });
  return page;
};
