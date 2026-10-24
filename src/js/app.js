/* Arranque: lee el formulario, compone la guía y la vuelve a componer cuando cambia una opción. */

/** Compone toda la guía para una build con las opciones dadas. */
function render(build, { cls, leagueStart, showZones }) {
  const skills = build.main && SKILLS[build.main.id] ? suggestSkills(build.main, cls, new Set([...routeDefs(build, leagueStart), "LIBRARY"])) : [];
  const own = new Set(build.gems.map(g => g.id).filter(Boolean));
  suggested = new Set(skills.flatMap(s => [s.skill, ...s.supports]).filter(id => id && !own.has(id)));
  const authorTrees = build.tree.stages.length > 0;
  const trees = authorTrees ? build.tree.stages : build.tree.classId ? suggestTrees(build.tree, build.bandit === "None") : [];
  const result = plan(build, cls, leagueStart, [...suggested]);
  doneStore.load("poe-gemas:" + cls + ":" + build.gems.map(g => g.name).join("|"));

  const out = $("out");
  out.hidden = false;
  out.replaceChildren();
  out.insertAdjacentHTML("beforeend", summaryHtml(build, result));
  $("who").textContent = cls + (cls === build.cls && build.ascend && build.ascend !== "None" ? " · " + build.ascend : "");
  if (skills.length) out.append(levelingSection(skills, authorTrees ? [] : trees, !authorTrees, build.main.id));
  if (build.items.length) out.append(gearSection(build.items));
  redrawHeat = null;
  if (build.tree.nodes.length) out.append(treeSection(build.tree, trees, !authorTrees));
  out.append(...routeSections(result.out, result.start, showZones));
  const other = otherWaysSection(build, result);
  if (other) out.append(other);
  renderToc();
}

/** Sin guía (campo vacío o código inválido) tampoco hay índice. */
const hideGuide = () => { $("out").hidden = $("toc").hidden = $("toc-toggle").hidden = true; };

let build = null;
const options = () => ({ cls: $("cls").value, leagueStart: $("league").checked, showZones: $("zones").checked });
const rerender = () => build && render(build, options());

async function run() {
  $("msg").className = ""; $("msg").textContent = "";
  if (!$("code").value.trim()) { hideGuide(); $("msg").textContent = "Primero pega el código de tu build: en Path of Building, Import/Export Build → Generate."; return; }
  try {
    build = parseBuild(await decode($("code").value));
    if (!build.gems.length) throw userError("la build no tiene gemas");
    if (CLASSES.includes(build.cls)) $("cls").value = build.cls;
    rerender();
    $("msg").textContent = `Build leída: ${build.gems.length} gemas.`;
  } catch (e) {
    hideGuide();
    $("msg").className = "error";
    // Los errores del navegador (base64 o zlib inválidos) no dicen nada útil; los nuestros sí.
    const why = e.own ? e.message : "no tiene el formato de un código de Path of Building";
    $("msg").textContent = "No he podido leer el código: " + why + ". Cópialo de nuevo desde Path of Building, en Import/Export Build → Generate.";
  }
}

CLASSES.forEach(c => $("cls").add(new Option(c, c)));
$("go").onclick = run;
for (const id of ["cls", "league", "zones"]) $(id).onchange = rerender;
$("msg").textContent = "Pega el código de tu build y pulsa Crear guía.";
restoreSession();
