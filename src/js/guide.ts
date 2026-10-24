/* La guía de una build, calculada: leveling sugerido, árboles, el plan de gemas y quién se está viendo. Sin interfaz. */

import { plan } from "./plan";
import { routeDefs } from "./route";
import { SKILLS } from "./data";
import { suggestSkills, suggestTrees } from "./suggest";

/** Todo lo que necesita <Guide> para dibujar la guía de una build. */
export interface GuideData {
  build: Build;
  /** Clase (y ascendencia) que se está viendo, para el resumen. */
  who: string;
  /** Leveling sugerido por tramos (vacío si la habilidad principal no se reconoce). */
  skills: StageSkill[];
  /** Gemas de leveling sugeridas que no están en la build. */
  suggested: Set<string>;
  /** Árboles por etapas: los de la build si los trae (authorTrees) o sugeridos. */
  trees: TreeStage[];
  authorTrees: boolean;
  plan: Plan;
}

/** Calcula la guía de una build para la clase y el modo (inicio de liga o no) dados. Mostrar las zonas es cosa del dibujo. */
export function buildGuide(build: Build, { cls, leagueStart }: Pick<GuideOptions, "cls" | "leagueStart">): GuideData {
  const skills = build.main && SKILLS[build.main.id] ? suggestSkills(build.main, cls, routeDefs(build, leagueStart, { library: true })) : [];
  // Las de la build y, de sus Vaal y transfiguradas, la gema base: también hay que conseguirla, así que no es "sugerida".
  const own = new Set(build.gems.flatMap(g => [g.id, g.base]).filter((id): id is string => !!id));
  const suggested = new Set(skills.flatMap(s => [s.skill, ...s.supports]).filter((id): id is string => !!id && !own.has(id)));
  const authorTrees = build.tree.stages.length > 0;
  const trees = authorTrees ? build.tree.stages : build.tree.classId ? suggestTrees(build.tree, build.bandit === "None") : [];
  return {
    build, skills, suggested, trees, authorTrees,
    who: cls + (cls === build.cls && build.ascend && build.ascend !== "None" ? " · " + build.ascend : ""),
    plan: plan(build, cls, leagueStart, [...suggested]),
  };
}
