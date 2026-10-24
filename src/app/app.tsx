/* La app: la página con sus eventos, la build leída y la guía, que se vuelve a componer cuando cambia una opción. */

import { CLASSES, SKILLS, isUserError, userError } from "../js/data";
import { plan } from "../js/plan";
import { decode, parseBuild } from "../js/pob";
import { routeDefs } from "../js/route";
import { suggestSkills, suggestTrees } from "../js/suggest";
import { GearSection } from "../components/gear/gear";
import { doneStore, setSuggested } from "../components/gem/gem";
import { setRedrawHeat } from "../components/heatmap/heatmap";
import { LevelingSection } from "../components/leveling/leveling";
import { OtherWays } from "../components/other-ways/other-ways";
import { Page } from "../components/page/page";
import { RouteSections } from "../components/route/route";
import { Summary } from "../components/summary/summary";
import { initToc, renderToc } from "../components/toc/toc";
import { TreeSection } from "../components/tree/tree";
import { startSession } from "./session";
import type { FormControls } from "./session";

/** Compone en `guide` toda la guía para una build con las opciones dadas. */
function renderGuide(guide: HTMLElement, build: Build, { cls, leagueStart, showZones }: GuideOptions): void {
  const skills = build.main && SKILLS[build.main.id] ? suggestSkills(build.main, cls, new Set([...routeDefs(build, leagueStart), "LIBRARY"])) : [];
  const own = new Set(build.gems.map(g => g.id).filter((id): id is string => !!id));
  // Gemas de leveling sugeridas que no están en la build: el plan las busca y los componentes las marcan como "sugerida".
  const suggested = new Set(skills.flatMap(s => [s.skill, ...s.supports]).filter((id): id is string => !!id && !own.has(id)));
  setSuggested(suggested);
  const authorTrees = build.tree.stages.length > 0;
  const trees = authorTrees ? build.tree.stages : build.tree.classId ? suggestTrees(build.tree, build.bandit === "None") : [];
  const result = plan(build, cls, leagueStart, [...suggested]);
  doneStore.load("poe-gemas:" + cls + ":" + build.gems.map(g => g.name).join("|"));
  const who = cls + (cls === build.cls && build.ascend && build.ascend !== "None" ? " · " + build.ascend : "");

  // El mapa de calor de la guía anterior deja de repintarse; TreeSection engancha el nuevo.
  setRedrawHeat(null);
  guide.hidden = false;
  guide.replaceChildren(
    <>
      <Summary build={build} plan={result} who={who} />
      {skills.length > 0 && build.main && <LevelingSection skills={skills} trees={authorTrees ? [] : trees} treesSuggested={!authorTrees} mainId={build.main.id} />}
      {build.items.length > 0 && <GearSection items={build.items} />}
      {build.tree.nodes.length > 0 && <TreeSection tree={build.tree} stages={trees} stagesSuggested={!authorTrees} />}
      <RouteSections steps={result.out} start={result.start} showZones={showZones} />
      <OtherWays build={build} plan={result} />
    </>
  );
  renderToc();
}

/**
 * La app entera: crea <Page> con sus eventos y guarda la build leída. main.tsx la pone en el documento en lugar de la
 * página prerenderizada, que es idéntica. Sin estado reactivo: cuando cambia algo, se vuelve a componer la guía.
 */
export const App: Component<{}, HTMLElement> = () => {
  let build: Build | null = null;
  const page = <Page classes={CLASSES} date={PAGE_DATE} license={PAGE_LICENSE} onBuild={() => void run()} onOptionsChange={() => rerender()} /> as HTMLElement;

  // Los elementos de la propia página que hay que leer o cambiar.
  const find = <T extends HTMLElement = HTMLElement>(id: string): T => page.querySelector<T>("#" + id)!;
  const form: FormControls = { code: find("code"), cls: find("cls"), league: find("league"), zones: find("zones") };
  const guide = find("out"), msg = find("msg"), toc = find("toc"), tocButton = find("toc-toggle");

  const say = (text: string, error = false) => { msg.className = error ? "error" : ""; msg.textContent = text; };
  /** Sin guía (campo vacío o código inválido) tampoco hay índice. */
  const hideGuide = () => { guide.hidden = toc.hidden = tocButton.hidden = true; };
  const options = (): GuideOptions => ({ cls: form.cls.value, leagueStart: form.league.checked, showZones: form.zones.checked });
  const rerender = (): void => { if (build) renderGuide(guide, build, options()); };

  /** Lee el código del formulario y, si es válido, compone la guía. */
  async function run(): Promise<void> {
    say("");
    // Sin código válido no queda ninguna build: si no, cambiar una opción volvería a mostrar la anterior.
    build = null;
    if (!form.code.value.trim()) { hideGuide(); say("Primero pega el código de tu build: en Path of Building, Import/Export Build → Generate."); return; }
    let read: Build;
    // Solo leer el código va en el try: un fallo al dibujar la guía es un error de la app, no un código mal copiado.
    try {
      read = parseBuild(await decode(form.code.value));
      if (!read.gems.length) throw userError("la build no tiene gemas");
    } catch (e) {
      hideGuide();
      // Los errores del navegador (base64 o zlib inválidos) no dicen nada útil; los nuestros sí.
      const why = isUserError(e) ? e.message : "no tiene el formato de un código de Path of Building";
      say("No he podido leer el código: " + why + ". Cópialo de nuevo desde Path of Building, en Import/Export Build → Generate.", true);
      return;
    }
    build = read;
    if (build.cls && CLASSES.includes(build.cls)) form.cls.value = build.cls;
    rerender();
    say(`Build leída: ${build.gems.length} gemas.`);
  }

  say("Pega el código de tu build y pulsa Crear guía.");
  // Lo que necesita la página ya en el documento (como un useEffect): main.tsx la monta justo al volver de aquí.
  queueMicrotask(() => {
    initToc();
    void startSession({ form, guide, run, rerender });
  });
  return page;
};
