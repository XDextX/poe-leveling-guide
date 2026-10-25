/* Tarjeta de un tramo del leveling sugerido: habilidad, soportes y cuánto del árbol final tendrías. */

import type { OtherSkill } from "../../js/guide";
import { newNotables } from "../../js/stats";
import { StageSkills } from "../stage-lines/stage-lines";
import "./stage-card.css";

interface StageCardProps {
  /** El tramo (actos y niveles) y, si la build tiene habilidad principal, lo que se sugiere para ella. */
  stage: StageSkill;
  /** Habilidad principal de la build, o null si no se reconoce (entonces solo van las otras). */
  mainId: string | null;
  /** Lo sugerido en este tramo para cada una de las otras habilidades de la build. */
  others: { other: OtherSkill; stage: StageSkill }[];
  /** Elige otra habilidad para este tramo. */
  onPick?: (id: string) => void;
  /** Árbol de este tramo y el del anterior, para listar los notables nuevos. */
  tree?: TreeStage;
  prev?: TreeStage;
  treesSuggested: boolean;
}

/** Tarjeta del tramo: habilidad, soportes y, si hay árbol, cuántos puntos y qué notables nuevos. */
export const StageCard: Component<StageCardProps, HTMLDivElement> = ({ stage: s, mainId, others, onPick, tree, prev, treesSuggested }) => {
  const fresh = newNotables(tree, prev);
  return (
    <div class="stagecard">
      <h3>Actos {s.acts[0]}-{s.acts[1]} <span>· nv {s.from}–{s.to}</span></h3>
      <StageSkills main={mainId ? { skillId: mainId, stage: s, onPick } : null} others={others} />
      <p class="note">Hasta {s.links} enlaces con objetos de este tramo (nivel de objeto ≈{s.to}): los soportes van por orden, usa los primeros si tienes menos.</p>
      {tree && (
        <p class="note">
          Árbol: {treesSuggested ? "≈" + tree.points + " puntos, " : ""}{tree.nodes.length} nodos{fresh.length ? ". Nuevos notables: " + fresh.join(", ") : ""}. Míralo en el mapa de calor, más abajo.
        </p>
      )}
    </div>
  ) as HTMLDivElement;
};
