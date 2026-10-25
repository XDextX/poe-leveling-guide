/* La guía de una build, calculada: leveling sugerido, árboles, el plan de gemas y quién se está viendo. Sin interfaz. */

import { plan } from "./plan";
import { routeDefs } from "./route";
import { SKILLS } from "./data";
import { isActive, isSupport, SKILL_KINDS, skillKind } from "./gems";
import type { SkillKind } from "./gems";
import { damageOf, mainElements } from "./damage";
import type { DamageForm, Element } from "./damage";
import { curseLimit, limitSkills } from "./limits";
import { fitSockets, socketBudget } from "./sockets";
import { suggestSkills, suggestTrees } from "./suggest";

/** Una habilidad de la build que no es la principal, con su leveling sugerido por tramos (los mismos que los de la principal). */
export interface OtherSkill { skill: MainSkill; kind: SkillKind; stages: StageSkill[] }

/**
 * Las habilidades de la build que no son la principal: cada gema activa de cada grupo, con los soportes del grupo, por orden de
 * importancia (supervivencia, daño, comodidad). Un grupo puede llevar varias activas (aura y movimiento, por ejemplo).
 */
function otherSkills(build: Build): MainSkill[] {
  const out: MainSkill[] = [];
  for (const ids of build.groups) {
    const supports = ids.filter(isSupport);
    for (const id of ids.filter(isActive)) if (id !== build.main?.id && !out.some(o => o.id === id)) out.push({ id, supports });
  }
  return out.sort((a, b) => SKILL_KINDS.indexOf(skillKind(a.id)) - SKILL_KINDS.indexOf(skillKind(b.id)));
}

/** Todo lo que necesita <Guide> para dibujar la guía de una build. */
export interface GuideData {
  build: Build;
  /** Clase que se está viendo, y su ascendencia si es la de la build (con otra clase no aplica). */
  cls: string;
  ascend: string | null;
  /** Leveling sugerido por tramos (vacío si la habilidad principal no se reconoce). */
  skills: StageSkill[];
  /** Los elementos de daño de la build en que se apoyan las sugerencias, de más a menos (vacío si no se distingue ninguno). */
  damage: Element[];
  /** Si el daño sale sobre todo de los golpes o de un efecto que dura (veneno, ignite, sangrado), según las estadísticas de PoB; null si el código no las trae. */
  damageForm: DamageForm | null;
  /** Lo mismo para las demás habilidades de la build (auras, heraldos, movimiento…). */
  others: OtherSkill[];
  /** Gemas de leveling sugeridas que no están en la build. */
  suggested: Set<string>;
  /** Árboles por etapas para el mapa de calor: los de la build si los trae o, si no, sugeridos. */
  treeStages: TreeStage[];
  /** Si treeStages son sugeridos por la app (y no los de la build). */
  treesSuggested: boolean;
  /** Un árbol por tramo del leveling sugerido; vacío si la build trae sus propios árboles (no encajan con los tramos). */
  levelingTrees: TreeStage[];
  plan: Plan;
}

/** Calcula la guía de una build para la clase y el modo (inicio de liga o no) dados. Mostrar las zonas es cosa del dibujo. */
export function buildGuide(build: Build, { cls, leagueStart }: Pick<GuideOptions, "cls" | "leagueStart">): GuideData {
  const defs = routeDefs(build, leagueStart, { library: true });
  const damage = damageOf(build);
  const skills = build.main && SKILLS[build.main.id] ? suggestSkills(build.main, cls, defs, damage) : [];
  const others = otherSkills(build).map((skill): OtherSkill => ({ skill, kind: skillKind(skill.id), stages: suggestSkills(skill, cls, defs, damage, true) }));
  const treesSuggested = build.tree.stages.length === 0;
  const treeStages = !treesSuggested ? build.tree.stages : build.tree.classId ? suggestTrees(build.tree, build.bandit === "None") : [];
  // En cada tramo, lo sugerido tiene que caber en los límites del juego (una maldición, marcas incluidas, y una sola marca, salvo que el árbol o el equipo den más maldiciones).
  const last = Math.max(skills.length, ...others.map(o => o.stages.length)) - 1;
  for (let i = 0; i <= last; i++) {
    const nodes = treesSuggested && treeStages[i] ? treeStages[i].nodes : build.tree.nodes;
    limitSkills([skills[i], ...others.map(o => o.stages[i])].filter(Boolean), curseLimit(nodes, i === last ? build.items : []));
    // Y en las casillas del equipo: primero la principal con sus soportes y luego las demás, por orden de importancia (ya vienen así).
    const stage = skills[i] ?? others[0]?.stages[i];
    fitSockets([
      ...(skills[i] ? [{ stage: skills[i], size: 1 + skills[i].supports.length }] : []),
      ...others.map(o => ({ stage: o.stages[i], size: 1 })),
    ], socketBudget(stage.to));
  }
  // Las de la build y, de sus Vaal y transfiguradas, la gema base: también hay que conseguirla, así que no es "sugerida".
  const own = new Set(build.gems.flatMap(g => [g.id, g.base]).filter((id): id is string => !!id));
  const suggested = new Set([...skills, ...others.flatMap(o => o.stages)].flatMap(s => [s.skill, ...s.supports]).filter((id): id is string => !!id && !own.has(id)));
  return {
    build, skills, others, damage: mainElements(damage.profile), damageForm: damage.form, suggested, treeStages, treesSuggested,
    levelingTrees: treesSuggested ? treeStages : [],
    cls, ascend: cls === build.cls && build.ascend && build.ascend !== "None" ? build.ascend : null,
    plan: plan(build, cls, leagueStart, [...suggested]),
  };
}
