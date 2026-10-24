/* Arranque: lee el formulario, compone la guía y la vuelve a componer cuando cambia una opción. */

// Estilos base (tema, formulario, paneles); cada componente importa los suyos.
import "../styles.css";
import { CLASSES, SKILLS, form, isUserError, userError } from "../js/data";
import { $ } from "../js/dom";
import { plan } from "../js/plan";
import { decode, parseBuild } from "../js/pob";
import { routeDefs } from "../js/route";
import { suggestSkills, suggestTrees } from "../js/suggest";
import { GearSection } from "../components/gear/gear";
import { doneStore, setSuggested, suggested } from "../components/gem/gem";
import { setRedrawHeat } from "../components/heatmap/heatmap";
import { LevelingSection } from "../components/leveling/leveling";
import { OtherWays } from "../components/other-ways/other-ways";
import { Page } from "../components/page/page";
import { RouteSections } from "../components/route/route";
import { Summary } from "../components/summary/summary";
import { initToc, renderToc } from "../components/toc/toc";
import { TreeSection } from "../components/tree/tree";
import { restoreSession } from "./session";

/** Compone toda la guía para una build con las opciones dadas. */
function render(build: Build, { cls, leagueStart, showZones }: GuideOptions): void {
  const skills = build.main && SKILLS[build.main.id] ? suggestSkills(build.main, cls, new Set([...routeDefs(build, leagueStart), "LIBRARY"])) : [];
  const own = new Set(build.gems.map(g => g.id).filter((id): id is string => !!id));
  setSuggested(new Set(skills.flatMap(s => [s.skill, ...s.supports]).filter((id): id is string => !!id && !own.has(id))));
  const authorTrees = build.tree.stages.length > 0;
  const trees = authorTrees ? build.tree.stages : build.tree.classId ? suggestTrees(build.tree, build.bandit === "None") : [];
  const result = plan(build, cls, leagueStart, [...suggested]);
  doneStore.load("poe-gemas:" + cls + ":" + build.gems.map(g => g.name).join("|"));
  const who = cls + (cls === build.cls && build.ascend && build.ascend !== "None" ? " · " + build.ascend : "");

  // El mapa de calor de la guía anterior deja de repintarse; TreeSection engancha el nuevo.
  setRedrawHeat(null);
  const out = $("out");
  out.hidden = false;
  out.replaceChildren(
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

/** Sin guía (campo vacío o código inválido) tampoco hay índice. */
const hideGuide = () => { $("out").hidden = $("toc").hidden = $("toc-toggle").hidden = true; };

let build: Build | null = null;
const options = (): GuideOptions => ({ cls: form.cls.value, leagueStart: form.league.checked, showZones: form.zones.checked });
export const rerender = (): void => { if (build) render(build, options()); };

export async function run(): Promise<void> {
  $("msg").className = ""; $("msg").textContent = "";
  // Sin código válido no queda ninguna build: si no, cambiar una opción volvería a mostrar la anterior.
  build = null;
  if (!form.code.value.trim()) { hideGuide(); $("msg").textContent = "Primero pega el código de tu build: en Path of Building, Import/Export Build → Generate."; return; }
  let read: Build;
  // Solo leer el código va en el try: un fallo al dibujar la guía es un error de la app, no un código mal copiado.
  try {
    read = parseBuild(await decode(form.code.value));
    if (!read.gems.length) throw userError("la build no tiene gemas");
  } catch (e) {
    hideGuide();
    $("msg").className = "error";
    // Los errores del navegador (base64 o zlib inválidos) no dicen nada útil; los nuestros sí.
    const why = isUserError(e) ? e.message : "no tiene el formato de un código de Path of Building";
    $("msg").textContent = "No he podido leer el código: " + why + ". Cópialo de nuevo desde Path of Building, en Import/Export Build → Generate.";
    return;
  }
  build = read;
  if (build.cls && CLASSES.includes(build.cls)) form.cls.value = build.cls;
  rerender();
  $("msg").textContent = `Build leída: ${build.gems.length} gemas.`;
}

// La página llega ya escrita en index.html (la prerenderiza el build); aquí se cambia por la misma página, creada con sus eventos.
document.querySelector("main")!.replaceWith(<Page classes={CLASSES} date={PAGE_DATE} license={PAGE_LICENSE} onBuild={run} onOptionsChange={rerender} />);
initToc();
$("msg").textContent = "Pega el código de tu build y pulsa Crear guía.";
restoreSession();
