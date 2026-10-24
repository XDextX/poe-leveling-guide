/* Leveling sugerido: un aviso de que es automático y una tarjeta por tramo. */

/** Leveling sugerido: por tramo, la habilidad y sus soportes y cuánto del árbol final tendrías. */
function levelingSection(skills: StageSkill[], trees: TreeStage[], treesSuggested: boolean, mainId: string): HTMLDetailsElement {
  const sec = section("Leveling sugerido", "act leveling", true, { id: "leveling", label: "Leveling sugerido" });
  sec.insertAdjacentHTML("beforeend", `
    <p class="banner"><b>Sugerencia automática.</b> Tu build no trae cómo subir de nivel, así que esto lo calcula la app: la habilidad más parecida a la tuya
    que tu clase puede conseguir a ese nivel (mismo tipo y misma arma), soportes que de verdad se pueden enlazar a ella (primero los de tu build) y
    ${treesSuggested ? "un orden para coger los nodos de tu árbol final." : "los árboles que trae tu build."} No es la guía del autor de la build ni lo que suele usar la comunidad.</p>`);
  sec.append(el("div", "stagecards", "", ...skills.map((s, i) => stageCard(s, mainId, trees[i], trees[i - 1], treesSuggested))));
  return sec;
}
