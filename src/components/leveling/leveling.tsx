/* Leveling sugerido: un aviso de que es automático y una tarjeta por tramo. */

import { Section } from "../section/section";
import { StageCard } from "../stage-card/stage-card";
import "./leveling.css";

interface LevelingSectionProps {
  skills: StageSkill[];
  /** Un árbol por tramo (vacío si la build trae los suyos). */
  trees: TreeStage[];
  treesSuggested: boolean;
  mainId: string;
}

/** Leveling sugerido: por tramo, la habilidad y sus soportes y cuánto del árbol final tendrías. */
export const LevelingSection: Component<LevelingSectionProps, HTMLDetailsElement> = ({ skills, trees, treesSuggested, mainId }) => (
  <Section title="Leveling sugerido" className="act leveling" toc={{ id: "leveling", label: "Leveling sugerido" }}>
    <p class="banner">
      <b>Sugerencia automática.</b> Tu build no trae cómo subir de nivel, así que esto lo calcula la app: la habilidad más parecida a la tuya
      que tu clase puede conseguir a ese nivel (mismo tipo y misma arma), soportes que de verdad se pueden enlazar a ella (primero los de tu build) y{" "}
      {treesSuggested ? "un orden para coger los nodos de tu árbol final." : "los árboles que trae tu build."} No es la guía del autor de la build ni lo que suele usar la comunidad.
    </p>
    <div class="stagecards">
      {skills.map((s, i) => <StageCard stage={s} mainId={mainId} tree={trees[i]} prev={trees[i - 1]} treesSuggested={treesSuggested} />)}
    </div>
  </Section>
) as HTMLDetailsElement;
