/* Las líneas de un tramo del leveling sugerido para una habilidad: la habilidad y sus soportes. */

import { GEMS } from "../../js/data";
import { reasonOf } from "../../js/reasons";
import { SKILL_KINDS, skillKind } from "../../js/gems";
import type { SkillKind } from "../../js/gems";
import type { OtherSkill } from "../../js/guide";
import { Gem } from "../gem/gem";
import { GemLine } from "../gem-line/gem-line";
import "./stage-lines.css";

interface StageLinesProps {
  stage: StageSkill;
  /** La habilidad de la build a la que sustituye este tramo (para "Cambia a … desde nv …"). */
  skillId: string;
  /** Para qué sirve: encabeza el bloque y fija su color. */
  kind: SkillKind;
  /** Es la habilidad principal de la build. */
  main?: boolean;
  /** Si se da, un selector deja elegir otra habilidad entre las del tramo; avisa con la que se eligió. */
  onPick?: (id: string) => void;
}

const KIND_ES: Record<SkillKind, string> = { survival: "Supervivencia", damage: "Daño", qol: "Comodidad" };

/** Un bloque por habilidad: para qué sirve, la habilidad y sus soportes. <StageLines stage={s} skillId={id} kind="damage" main /> */
export const StageLines: Component<StageLinesProps, HTMLDivElement> = ({ stage: s, skillId, kind, main = false, onPick }) => (
  <div class={"skill-block " + kind}>
    <span class="skill-tag">{KIND_ES[kind]}{main ? " · principal" : ""}</span>
    {onPick && s.options.length > 1 && (
      <label class="skill-pick">Elegir habilidad{" "}
        <select onChange={(e: Event) => onPick((e.target as HTMLSelectElement).value)}>
          {s.options.map(o => <option value={o.id} selected={o.id === s.skill}>{GEMS[o.id].name}{o.id === s.recommended ? " (recomendada)" : ""} · {reasonOf(o.id)}</option>)}
        </select>
      </label>
    )}
    {s.skill && <GemLine how={s.own ? "Tu habilidad" : "Habilidad"} ids={[s.skill]} note={s.mainAt ? `Cambia a ${GEMS[skillId].name} desde nv ${s.mainAt}` : ""} />}
    {s.supports.length > 0 && <GemLine how="Soportes" ids={s.supports} />}
  </div>
) as HTMLDivElement;

interface StageSkillsProps {
  /** Lo sugerido para la habilidad principal en este tramo, o null si no hay. */
  main: { skillId: string; stage: StageSkill; onPick?: (id: string) => void } | null;
  /** Lo sugerido para cada una de las otras habilidades de la build en este tramo. */
  others: { other: OtherSkill; stage: StageSkill }[];
}

interface KindBlockProps { kind: SkillKind; items: { other: OtherSkill; stage: StageSkill }[] }

/** Las otras habilidades de un mismo tipo en un tramo, juntas y sin soportes (los de su grupo de PoB valen para varias a la vez). */
const KindBlock: Component<KindBlockProps, HTMLDivElement> = ({ kind, items }) => (
  <div class={"skill-block " + kind}>
    <span class="skill-tag">{KIND_ES[kind]}</span>
    <div class="line">{items.map(({ stage }) => <Gem id={stage.skill!} />)}</div>
    {items.filter(({ stage }) => stage.mainAt).map(({ other, stage }) => <span class="cost">Cambia a {GEMS[other.skill.id].name} desde nv {stage.mainAt}</span>)}
  </div>
) as HTMLDivElement;

/**
 * Todas las habilidades de un tramo, de más a menos importante: supervivencia, daño y comodidad. La principal lleva su bloque, con
 * soportes, entre las de su tipo; las demás, un bloque por tipo con solo las habilidades que ya se consiguen en ese tramo.
 */
export const StageSkills: Component<StageSkillsProps, DocumentFragment> = ({ main, others }) => {
  const mainKind = main ? skillKind(main.skillId) : null;
  const blocks = SKILL_KINDS.flatMap(kind => {
    const items = others.filter(o => o.other.kind === kind && o.stage.skill);
    return [
      ...(main && mainKind === kind && (main.stage.skill || main.stage.supports.length) ? [<StageLines stage={main.stage} skillId={main.skillId} kind={kind} main onPick={main.onPick} />] : []),
      ...(items.length ? [<KindBlock kind={kind} items={items} />] : []),
    ];
  });
  // Lo que se quitó por los límites de maldiciones y marcas: la guía lo dice, para que no parezca que faltan habilidades de la build.
  const noRoom = [...new Set([...(main ? [main.stage] : []), ...others.map(o => o.stage)].flatMap(st => st.noRoom ? [GEMS[st.noRoom].name] : []))];
  const dropped = [...new Set([...(main ? [main.stage] : []), ...others.map(o => o.stage)].flatMap(st => st.dropped ? [GEMS[st.dropped].name] : []))];
  return (
    <>
      {blocks}
      {noRoom.length > 0 && <p class="note limit-note">No caben en las casillas de tu equipo en este tramo: {noRoom.join(", ")}. Con objetos de este nivel el pecho, las armas y las demás piezas dan para menos; se irán sumando en los siguientes tramos.</p>}
      {dropped.length > 0 && <p class="note limit-note">No caben a la vez: {dropped.join(", ")}. Solo cabe una maldición a la vez (las marcas cuentan como maldiciones) y una sola marca, hasta que el árbol o el equipo den más maldiciones (Whispers of Doom, Occultist…).</p>}
    </>
  ) as DocumentFragment;
};
