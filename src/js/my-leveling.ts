/* "Mi leveling": los tramos que edita el jugador, partiendo de lo sugerido. Sin interfaz. */

import { GEMS } from "./data";
import type { GuideData } from "./guide";
import { canSupport, growTrees } from "./suggest";
import { isActive } from "./gems";
import { maxSockets } from "./sockets";

/** Nivel máximo del juego: hasta aquí llega el último tramo. */
export const MAX_LEVEL = 100;

/** Nivel en que empieza el tramo `i`: el siguiente al que acaba el anterior. */
export const fromOf = (stages: MyStage[], i: number): number => (i ? stages[i - 1].to + 1 : 1);

/** Los tramos que la guía sugiere (los de la habilidad principal o, sin ella, los de la primera de las otras), listos para editar. */
export function defaultLeveling({ skills, others, levelingTrees, treesSuggested }: Pick<GuideData, "skills" | "others" | "levelingTrees" | "treesSuggested">): MyStage[] {
  const base = skills.length ? skills : others[0]?.stages ?? [];
  return base.map((s, i) => ({
    to: s.to, skill: skills[i]?.skill ?? null, supports: [...(skills[i]?.supports ?? [])],
    others: others.map(o => o.stages[i]?.skill).filter((id): id is string => !!id),
    points: treesSuggested ? levelingTrees[i]?.points ?? null : null, note: "",
  }));
}

/** Los mismos tramos sin contenido: para empezar de cero sin perder dónde acaba cada uno. */
export const clearLeveling = (stages: MyStage[]): MyStage[] => stages.map(s => ({ to: s.to, skill: null, supports: [], others: [], points: s.points === null ? null : 0, note: "" }));

/** Cambia el nivel en que acaba el tramo `i`, sin pasar del siguiente ni quedar por debajo de donde empieza. */
export function setTo(stages: MyStage[], i: number, to: number): MyStage[] {
  const clamped = Math.min(i < stages.length - 1 ? stages[i + 1].to - 1 : MAX_LEVEL, Math.max(fromOf(stages, i), Math.round(to) || 0));
  return stages.map((s, j) => j === i ? { ...s, to: clamped } : s);
}

/** Parte el tramo `i` en dos por la mitad (la primera mitad es copia del tramo); no hace nada si solo abarca un nivel. */
export function splitStage(stages: MyStage[], i: number): MyStage[] {
  const from = fromOf(stages, i), mid = from + Math.floor((stages[i].to - from) / 2);
  if (mid >= stages[i].to) return stages;
  const first = { ...stages[i], to: mid, supports: [...stages[i].supports], others: [...stages[i].others] };
  return [...stages.slice(0, i), first, ...stages.slice(i)];
}

/** Junta el tramo `i` con el siguiente: queda el contenido del siguiente, que ahora empieza donde empezaba el `i`. */
export const mergeStage = (stages: MyStage[], i: number): MyStage[] => i < stages.length - 1 ? stages.filter((_, j) => j !== i) : stages;

/** Cambia los puntos de árbol de un tramo; nunca por debajo de los del anterior (el árbol solo crece). */
export function setPoints(stages: MyStage[], i: number, points: number): MyStage[] {
  return stages.map((s, j) => j === i ? { ...s, points: Math.max(j && stages[j - 1].points !== null ? stages[j - 1].points! : 0, Math.round(points) || 0) } : s);
}

/** Avisos de un tramo (de `from` a `to`): gemas que piden más nivel, soportes que no valen para la habilidad y más soportes que enlaces. */
export function warnings({ skill, supports, others, to }: MyStage): string[] {
  const out: string[] = [];
  const level = (id: string) => { if (GEMS[id].level > to) out.push(`${GEMS[id].name} pide nivel ${GEMS[id].level}, y este tramo acaba en el ${to}.`); };
  if (skill) {
    level(skill);
    if (!isActive(skill)) out.push(`${GEMS[skill].name} no es una habilidad.`);
    for (const id of supports) { level(id); if (isActive(skill) && !canSupport(id, skill)) out.push(`${GEMS[id].name} no puede apoyar a ${GEMS[skill].name}.`); }
    const room = maxSockets(to) - 1;
    if (supports.length > room) out.push(`Con objetos de nivel ≈${to} caben ${room} soportes, y hay ${supports.length}.`);
  } else if (supports.length) out.push("Hay soportes pero ninguna habilidad.");
  others.forEach(level);
  return out;
}

/** Los nodos de árbol de cada tramo: los que salen de sus puntos (si el árbol es sugerido) o los árboles del autor, por posición. */
export function stageNodes(build: Build, stages: MyStage[], treesSuggested: boolean): string[][] {
  if (!treesSuggested) return stages.map((_, i) => (build.tree.stages[i] ?? { nodes: build.tree.nodes }).nodes);
  const trees = growTrees(build.tree, stages.map((s, i) => ({ points: s.points ?? 0, level: s.to, title: `Tramo ${i + 1}`, weight: i })));
  return stages.map((_, i) => trees[i]?.nodes ?? []);
}

const isId = (id: unknown): id is string => typeof id === "string" && Object.hasOwn(GEMS, id);

/**
 * Los tramos que se leyeron del navegador o de un código, comprobados: lo que no es un tramo válido se descarta y los ids de gema
 * que ya no existen (otra versión de los datos) se quitan. undefined si no queda ningún tramo o los niveles no suben.
 */
export function sanitizeLeveling(raw: unknown): MyStage[] | undefined {
  if (!Array.isArray(raw) || !raw.length || raw.length > 50) return undefined;
  const out: MyStage[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    const to = Number(r?.to), ids = (v: unknown): string[] => Array.isArray(v) ? [...new Set(v.filter(isId))] : [];
    if (!Number.isInteger(to) || to < 1 || to > MAX_LEVEL || (out.length && to <= out[out.length - 1].to)) return undefined;
    out.push({ to, skill: isId(r.skill) ? r.skill : null, supports: ids(r.supports), others: ids(r.others), points: r.points === null ? null : Math.max(0, Math.round(Number(r.points)) || 0), note: typeof r.note === "string" ? r.note.slice(0, 300) : "" });
  }
  return out;
}
