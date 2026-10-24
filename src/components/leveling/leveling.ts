/* Leveling sugerido: una tarjeta por tramo con habilidad, soportes y árbol. */

/** Leveling sugerido: por tramo, la habilidad y sus soportes y cuánto del árbol final tendrías. */
function levelingSection(skills: StageSkill[], trees: TreeStage[], treesSuggested: boolean, mainId: string): HTMLDetailsElement {
  const sec = section("Leveling sugerido", "act gear leveling", true, { id: "leveling", label: "Leveling sugerido" });
  sec.insertAdjacentHTML("beforeend", `
    <p class="banner"><b>Sugerencia automática.</b> Tu build no trae cómo subir de nivel, así que esto lo calcula la app: la habilidad más parecida a la tuya
    que tu clase puede conseguir a ese nivel (mismo tipo y misma arma), soportes que de verdad se pueden enlazar a ella (primero los de tu build) y
    ${treesSuggested ? "un orden para coger los nodos de tu árbol final." : "los árboles que trae tu build."} No es la guía del autor de la build ni lo que suele usar la comunidad.</p>
    <div class="stagecards"></div>`);
  const box = sec.querySelector(".stagecards")!;
  skills.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "stagecard";
    card.innerHTML = `<h3>Actos ${s.acts[0]}-${s.acts[1]} <span>· nv ${s.from}–${s.to}</span></h3>`;
    if (s.skill) card.append(gemLine(s.own ? "Tu habilidad" : "Habilidad", [s.skill], { note: s.mainAt ? `Cambia a ${esc(GEMS[mainId].name)} desde nv ${s.mainAt}` : "" }));
    if (s.supports.length) card.append(gemLine("Soportes", s.supports, { note: "por orden: con pocos enlaces, usa los primeros" }));
    const t = trees[i];
    if (t) {
      const prev = new Set(i ? trees[i - 1].nodes : []);
      const fresh = t.nodes.filter(id => !prev.has(id) && (NODES[id].type === NODE.NOTABLE || NODES[id].type === NODE.KEYSTONE)).map(id => NODES[id].name);
      card.insertAdjacentHTML("beforeend", `<p class="note">Árbol: ${treesSuggested ? "≈" + t.points + " puntos, " : ""}${t.nodes.length} nodos${fresh.length ? ". Nuevos notables: " + esc(fresh.join(", ")) : ""}. Míralo en el mapa de calor, más abajo.</p>`);
    }
    box.append(card);
  });
  return sec;
}
