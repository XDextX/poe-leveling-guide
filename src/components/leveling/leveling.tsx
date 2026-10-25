/* Leveling sugerido: un aviso de que es automático y una tarjeta por tramo. */

import { ELEMENT_ES, FORM_ES } from "../../js/damage";
import type { DamageForm, Element } from "../../js/damage";
import type { OtherSkill } from "../../js/guide";
import { Section } from "../section/section";
import { StageCard } from "../stage-card/stage-card";
import "./leveling.css";

interface LevelingSectionProps {
  /** Lo sugerido para la habilidad principal por tramos (vacío si no se reconoce). */
  skills: StageSkill[];
  /** Lo mismo para las demás habilidades de la build. */
  others: OtherSkill[];
  /** Elementos de daño de la build en que se apoyan las sugerencias. */
  damage: Element[];
  /** De dónde sale el daño según PoB, si el código lo trae. */
  form: DamageForm | null;
  /** Un árbol por tramo (vacío si la build trae los suyos). */
  trees: TreeStage[];
  treesSuggested: boolean;
  mainId: string | null;
  /** Las notas del autor hablan de subir de nivel: lo calculado aquí es solo un respaldo. */
  authorLeveling?: boolean;
  /** Elige otra habilidad para un tramo (su posición y la gema). */
  onPick?: (stage: number, id: string) => void;
}

/** Leveling sugerido: por tramo, la habilidad principal y las demás (de más a menos importante: supervivencia, daño, comodidad) con sus soportes y cuánto del árbol final tendrías. */
export const LevelingSection: Component<LevelingSectionProps, HTMLDetailsElement> = ({ skills, others, damage, form, trees, treesSuggested, mainId, authorLeveling = false, onPick }) => (
  <Section title="Leveling sugerido" className="act leveling" toc={{ id: "leveling", label: "Leveling sugerido" }}>
    <p class="banner">
      <b>Sugerencia automática.</b> {authorLeveling ? <>Las notas de tu autor hablan de cómo subir de nivel (arriba, en «Notas del autor»): síguelas antes que esto, que es solo un respaldo. La app calcula</> : <>Tu build no trae cómo subir de nivel, así que esto lo calcula la app</>}: la habilidad más parecida a la tuya
      que tu clase puede conseguir a ese nivel (mismo tipo y misma arma), soportes que de verdad se pueden enlazar a ella (primero los de tu build) y{" "}
      {treesSuggested ? "un orden para coger los nodos de tu árbol final." : "los árboles que trae tu build."} {form && <>Según Path of Building, tu daño sale sobre todo de {FORM_ES[form.kind]} ({Math.round(form.share * 100)} %), así que prefiere gemas que lo potencien. </>}{damage.length > 0 && <>Prefiere gemas de {damage.map(e => ELEMENT_ES[e]).join(", ")}, los elementos que se deducen de tu habilidad principal, sus soportes, tu árbol y tu equipo. </>}No es la guía del autor de la build ni lo que suele usar la comunidad.
    </p>
    <div class="stagecards">
      {/* Los tramos son los mismos para todas; los da la principal o, si no hay, la primera de las otras. */}
      {(skills.length ? skills : others[0].stages).map((s, i) => (
        <StageCard stage={s} mainId={skills.length ? mainId : null} others={others.map(other => ({ other, stage: other.stages[i] }))} onPick={onPick && (id => onPick(i, id))} tree={trees[i]} prev={trees[i - 1]} treesSuggested={treesSuggested} />
      ))}
    </div>
  </Section>
) as HTMLDetailsElement;
