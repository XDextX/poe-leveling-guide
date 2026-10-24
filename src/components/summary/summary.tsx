/* Resumen de la guía: reparto de gemas, bandidos y moneda total. */

import { costText, suggested } from "../gem/gem";
import "./summary.css";

interface SummaryProps {
  build: Build;
  plan: Plan;
  /** Clase que se está viendo y, si aplica, su ascendencia. */
  cls: string;
  ascend: string | null;
}

/** Las dos líneas del resumen. */
export const Summary: Component<SummaryProps, DocumentFragment> = ({ build, plan, cls, ascend }) => {
  const { out: steps, missing } = plan;
  const special = build.gems.filter(g => g.kind !== "normal");
  const rewards = steps.reduce((n, s) => n + s.gems.filter(g => !g.buy).length, 0);
  const boughtIds = steps.flatMap(s => s.gems.filter(g => g.buy).flatMap(g => g.ids));
  return (
    <>
      <div class="summary" id="resumen" data-toc="Resumen">
        <span><b>{ascend ? `${cls} · ${ascend}` : cls}</b></span>
        <span><b>{build.gems.length}</b> gemas</span>
        <span><b>{rewards}</b> como recompensa</span>
        <span><b>{boughtIds.length}</b> compradas</span>
        <span><b>{missing.length + special.length}</b> por otras vías</span>
        {suggested.size > 0 && <span>(recompensas y compras incluyen <b>{suggested.size}</b> sugeridas de leveling)</span>}
        <span>Bandidos: <b>{build.bandit === "None" ? "matarlos a todos" : "ayudar a " + build.bandit}</b></span>
      </div>
      <div class="summary">Moneda para todas las compras: <b>{costText(boughtIds) || "nada"}</b></div>
    </>
  ) as DocumentFragment;
};
