/* "Mi leveling": los tramos que edita el jugador, partiendo de lo sugerido. Sin interfaz. */

import { GEMS } from "./data";
import type { GuideData } from "./guide";
import { canSupport, growTrees } from "./suggest";
import { isActive } from "./gems";
import { assignSlots, maxSockets, slotCapacities, slotName } from "./sockets";

/** Nivel máximo del juego: hasta aquí llega el último tramo. */
export const MAX_LEVEL = 100;

/** Nivel en que empieza el tramo `i`: el siguiente al que acaba el anterior. */
export const fromOf = (stages: MyStage[], i: number): number => (i ? stages[i - 1].to + 1 : 1);

/** Los tramos que la guía sugiere (los de la habilidad principal o, sin ella, los de la primera de las otras), listos para editar. */
export function defaultLeveling({ skills, others, levelingTrees, treesSuggested }: Pick<GuideData, "skills" | "others" | "levelingTrees" | "treesSuggested">): MyStage[] {
  const base = skills.length ? skills : others[0]?.stages ?? [];
  return base.map((s, i) => ({
    to: s.to, skill: skills[i]?.skill ?? null, supports: [...(skills[i]?.supports ?? [])],
    others: others.flatMap(o => o.stages[i]?.skill ? [{ skill: o.stages[i].skill!, supports: [] }] : []),
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
  const first = { ...stages[i], to: mid, supports: [...stages[i].supports], others: stages[i].others.map(o => ({ ...o, supports: [...o.supports] })) };
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
  for (const other of others) {
    level(other.skill);
    for (const id of other.supports) { level(id); if (!canSupport(id, other.skill)) out.push(`${GEMS[id].name} no puede apoyar a ${GEMS[other.skill].name}.`); }
  }
  // Los grupos de otras habilidades que no caben en ninguna pieza: el aviso dice la causa (demasiado grandes o sin sitio).
  const slots = slotsOf({ skill, supports, others, to }), caps = slotCapacities(to).map(([, n]) => n), biggest = Math.max(...caps), biggestOutsideChest = Math.max(...caps.slice(1));
  others.forEach((o, k) => {
    if (slots[k + 1]) return;
    const size = 1 + o.supports.length, name = `${GEMS[o.skill].name}${o.supports.length ? ` con ${o.supports.length} soporte${o.supports.length === 1 ? "" : "s"}` : ""}`;
    if (size > biggest) out.push(`${name} necesita ${size} enlazadas; con objetos de nivel ≈${to} ninguna pieza pasa de ${biggest}. Quita ${size - biggest} soporte${size - biggest === 1 ? "" : "s"} o pásalo a un tramo de más nivel.`);
    else if (size > biggestOutsideChest) out.push(`${name} necesita ${size} enlazadas; con objetos de nivel ≈${to} ninguna pieza (salvo el pecho, que ya está ocupado) pasa de ${biggestOutsideChest}. Quita ${size - biggestOutsideChest} soporte${size - biggestOutsideChest === 1 ? "" : "s"} o pásalo a un tramo de más nivel.`);
    else out.push(`No queda sitio para ${GEMS[o.skill].name}: los demás grupos ocupan el equipo. Quita otra habilidad o algún soporte.`);
  });
  return out;
}

/** Los grupos de gemas de un tramo (la principal primero, con sus soportes; luego cada otra habilidad) con las casillas que ocupan. */
export const groupsOf = ({ skill, supports, others }: Pick<MyStage, "skill" | "supports" | "others">): { ids: string[]; label: string; supports: number }[] => [
  { ids: skill ? [skill, ...supports] : [], label: skill ? GEMS[skill].name : "", supports: skill ? supports.length : 0 },
  ...others.map(o => ({ ids: [o.skill, ...o.supports], label: GEMS[o.skill].name, supports: o.supports.length })),
];

/** En qué pieza del equipo cae cada grupo de groupsOf (el nombre de PoB) o null si no cabe, con los objetos del nivel `to`. */
export const slotsOf = (stage: Pick<MyStage, "skill" | "supports" | "others" | "to">): (string | null)[] =>
  assignSlots(groupsOf(stage).map(g => g.ids.length), stage.to);

/** Un grupo de gemas tal como se escribe en PoB: la pieza del equipo (null si no cabe), sus gemas y las habilidades que lleva (con sus soportes). */
export interface SlotGroup { slot: string | null; ids: string[]; parts: { label: string; supports: number }[]; main: boolean }

/**
 * Los grupos de un tramo por pieza del equipo: la habilidad principal con sus soportes va aparte (sus soportes son solo suyos), y
 * las otras habilidades que caen en la misma pieza van juntas en un grupo (sus gemas comparten enlaces, como en un casco de 4
 * casillas); las que no caben en ninguna pieza siguen cada una por su cuenta. Los grupos vacíos no salen.
 */
export function slotGroups(stage: Pick<MyStage, "skill" | "supports" | "others" | "to">): SlotGroup[] {
  const slots = slotsOf(stage), out: SlotGroup[] = [];
  groupsOf(stage).forEach((g, k) => {
    if (!g.ids.length) return;
    const part = { label: g.label, supports: g.supports }, same = k > 0 && slots[k] ? out.find(o => !o.main && o.slot === slots[k]) : undefined;
    if (same) { same.ids.push(...g.ids); same.parts.push(part); }
    else out.push({ slot: slots[k], ids: [...g.ids], parts: [part], main: k === 0 });
  });
  return out;
}

/** El reparto en el equipo, una pieza por línea: "Pecho — Lacerate + 4 soportes (5 enlazadas)", "Casco — Pride, Leap Slam". */
export const slotLines = (stage: Pick<MyStage, "skill" | "supports" | "others" | "to">): string[] =>
  slotGroups(stage).filter(g => g.slot).map(g => {
    const names = g.parts.map(p => p.label + (p.supports ? ` + ${p.supports} soporte${p.supports === 1 ? "" : "s"}` : "")).join(", ");
    return `${slotName(g.slot!)} — ${names}${g.ids.length > g.parts.length ? ` (${g.ids.length} enlazadas)` : ""}`;
  });

/** Los nodos de árbol de cada tramo: los que salen de sus puntos (si el árbol es sugerido) o los árboles del autor, por posición. */
export function stageNodes(build: Build, stages: MyStage[], treesSuggested: boolean): string[][] {
  if (!treesSuggested) return stages.map((_, i) => (build.tree.stages[i] ?? { nodes: build.tree.nodes }).nodes);
  const trees = growTrees(build.tree, stages.map((s, i) => ({ points: s.points ?? 0, level: s.to, title: `Tramo ${i + 1}`, weight: i })));
  return stages.map((_, i) => trees[i]?.nodes ?? []);
}

const isId = (id: unknown): id is string => typeof id === "string" && Object.hasOwn(GEMS, id);

const uniqueIds = (v: unknown): string[] => Array.isArray(v) ? [...new Set(v.filter(isId))] : [];
/** Una otra habilidad guardada, comprobada: antes era solo el id de la gema, y se sigue entendiendo. */
const otherOf = (o: unknown): MyOther[] => {
  const r = typeof o === "string" ? { skill: o, supports: [] } : (o as Partial<MyOther> | null);
  return isId(r?.skill) ? [{ skill: r.skill, supports: uniqueIds(r.supports) }] : [];
};

/**
 * Los tramos que se leyeron del navegador o de un código, comprobados: lo que no es un tramo válido se descarta y los ids de gema
 * que ya no existen (otra versión de los datos) se quitan. undefined si no queda ningún tramo o los niveles no suben.
 */
export function sanitizeLeveling(raw: unknown): MyStage[] | undefined {
  if (!Array.isArray(raw) || !raw.length || raw.length > 50) return undefined;
  const out: MyStage[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    const to = Number(r?.to);
    if (!Number.isInteger(to) || to < 1 || to > MAX_LEVEL || (out.length && to <= out[out.length - 1].to)) return undefined;
    out.push({
      to, skill: isId(r.skill) ? r.skill : null, supports: uniqueIds(r.supports), others: Array.isArray(r.others) ? r.others.flatMap(otherOf) : [],
      points: r.points === null ? null : Math.max(0, Math.round(Number(r.points)) || 0), note: typeof r.note === "string" ? r.note.slice(0, 300) : "",
    });
  }
  return out;
}
