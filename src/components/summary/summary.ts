/* Resumen de la guía: reparto de gemas, bandidos y moneda total. */

function summaryHtml(build: Build, plan: Plan): string {
  const { out: steps, missing } = plan;
  const special = build.gems.filter(g => g.kind !== "normal");
  const rewards = steps.reduce((n, s) => n + s.gems.filter(g => !g.buy).length, 0);
  const boughtIds = steps.flatMap(s => s.gems.filter(g => g.buy).flatMap(g => g.ids));
  return `<div class="summary" id="resumen" data-toc="Resumen">
    <span><b id="who"></b></span><span><b>${build.gems.length}</b> gemas</span>
    <span><b>${rewards}</b> como recompensa</span><span><b>${boughtIds.length}</b> compradas</span>
    <span><b>${missing.length + special.length}</b> por otras vías</span>
    ${suggested.size ? `<span>(recompensas y compras incluyen <b>${suggested.size}</b> sugeridas de leveling)</span>` : ""}
    <span>Bandidos: <b>${build.bandit === "None" ? "matarlos a todos" : "ayudar a " + esc(build.bandit)}</b></span></div>
    <div class="summary">Moneda para todas las compras: <b>${costText(boughtIds) || "nada"}</b></div>`;
}
