/* "Mi leveling": los tramos que edita el jugador, partiendo de lo sugerido. Sin interfaz. */

import { CLASS_STARTS, GEMS, NODES } from "./data";
import type { GuideData } from "./guide";
import { canSupport } from "./suggest";
import { connectingPaths, stayConnected } from "./tree-graph";
import { isActive } from "./gems";
import { assignSlots, maxSockets, slotCapacities, slotName } from "./sockets";

/** Nivel máximo del juego: hasta aquí llega el último tramo. */
export const MAX_LEVEL = 100;

/** Nivel en que empieza el tramo `i`: el siguiente al que acaba el anterior. */
export const fromOf = (stages: MyStage[], i: number): number => (i ? stages[i - 1].to + 1 : 1);

/** Los tramos que la guía sugiere (los de la habilidad principal o, sin ella, los de la primera de las otras), listos para editar. */
/** El árbol de cada tramo empieza en blanco: lo elige el jugador (ver applyTreeChange). */
export function defaultLeveling({ skills, others }: Pick<GuideData, "skills" | "others">): MyStage[] {
  const base = skills.length ? skills : others[0]?.stages ?? [];
  return base.map((s, i) => ({
    to: s.to, skill: skills[i]?.skill ?? null, supports: [...(skills[i]?.supports ?? [])],
    others: others.flatMap(o => o.stages[i]?.skill ? [{ skill: o.stages[i].skill!, supports: [] }] : []),
    nodes: [], note: "",
  }));
}

/** Los mismos tramos sin contenido: para empezar de cero sin perder dónde acaba cada uno. */
export const clearLeveling = (stages: MyStage[]): MyStage[] => stages.map(s => ({ to: s.to, skill: null, supports: [], others: [], nodes: [], note: "" }));

/** Cambia el nivel en que acaba el tramo `i`, sin pasar del siguiente ni quedar por debajo de donde empieza. */
export function setTo(stages: MyStage[], i: number, to: number): MyStage[] {
  const clamped = Math.min(i < stages.length - 1 ? stages[i + 1].to - 1 : MAX_LEVEL, Math.max(fromOf(stages, i), Math.round(to) || 0));
  return stages.map((s, j) => j === i ? { ...s, to: clamped } : s);
}

/** Parte el tramo `i` en dos por la mitad (la primera mitad es copia del tramo); no hace nada si solo abarca un nivel. */
export function splitStage(stages: MyStage[], i: number): MyStage[] {
  const from = fromOf(stages, i), mid = from + Math.floor((stages[i].to - from) / 2);
  if (mid >= stages[i].to) return stages;
  const first = { ...stages[i], to: mid, supports: [...stages[i].supports], others: stages[i].others.map(o => ({ ...o, supports: [...o.supports] })), nodes: [...stages[i].nodes], own: stages[i].own && [...stages[i].own!] };
  return [...stages.slice(0, i), first, ...stages.slice(i)];
}

/** Junta el tramo `i` con el siguiente: queda el contenido del siguiente, que ahora empieza donde empezaba el `i`. */
export const mergeStage = (stages: MyStage[], i: number): MyStage[] => i < stages.length - 1 ? stages.filter((_, j) => j !== i) : stages;

/** Los puntos de árbol que se pueden haber gastado al llegar a ese nivel: uno por nivel menos el primero, más los de las misiones (≈24 con los bandidos). */
export const pointsAvailable = (level: number): number => level - 1 + 24;

/** El aviso del árbol de un tramo si gasta más puntos de los que hay a ese nivel; "" si no. */
export const treeWarning = ({ nodes, to }: Pick<MyStage, "nodes" | "to">): string =>
  nodes.length > pointsAvailable(to) ? `Gastas ${nodes.length} puntos y con nivel ${to} hay como mucho ≈${pointsAvailable(to)} (uno por nivel y ≈24 de misiones).` : "";

/** Los nodos que el jugador cogió directamente en el tramo `j`; si no se guardó, los que no tiene el tramo anterior. */
export const ownOf = (stages: MyStage[], j: number): string[] => stages[j].own ?? stages[j].nodes.filter(id => !(j && stages[j - 1].nodes.includes(id)));

/**
 * Cambia los nodos del árbol del tramo `i` (el árbol de cada tramo parte del anterior). Lo que se añade se añade también a los tramos
 * siguientes. Lo que se quita solo se quita de un tramo siguiente si lo había heredado de este: lo que ese tramo cogió por su cuenta se
 * queda, y también el camino que lo une al inicio. Los tramos anteriores no cambian.
 */
export function applyTreeChange(stages: MyStage[], i: number, nodes: string[], classId: string): MyStage[] {
  const start = CLASS_STARTS[classId], had = new Set(stages[i].nodes), now = new Set(nodes);
  const added = nodes.filter(id => !had.has(id)), removed = new Set(stages[i].nodes.filter(id => !now.has(id)));
  const own = stages.map((_, j) => ownOf(stages, j));
  return stages.map((s, j) => {
    if (j < i) return s;
    if (j === i) return { ...s, nodes, own: [...own[i].filter(id => !removed.has(id)), ...added] };
    const mine = new Set(own[j]), grown = [...s.nodes, ...added.filter(id => !s.nodes.includes(id))];
    const needed = start ? connectingPaths(grown, start, own[j]) : new Set<string>();
    const left = grown.filter(id => !removed.has(id) || mine.has(id) || needed.has(id));
    return { ...s, nodes: start ? stayConnected(left, start) : left, own: own[j] };
  });
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
    const to = Number(r?.to), nodes = Array.isArray(r?.nodes) ? [...new Set((r.nodes as unknown[]).filter((id): id is string => typeof id === "string" && Object.hasOwn(NODES, id)))] : [];
    if (!Number.isInteger(to) || to < 1 || to > MAX_LEVEL || (out.length && to <= out[out.length - 1].to)) return undefined;
    out.push({
      to, skill: isId(r.skill) ? r.skill : null, supports: uniqueIds(r.supports), others: Array.isArray(r.others) ? r.others.flatMap(otherOf) : [],
      nodes, own: Array.isArray(r.own) ? [...new Set((r.own as unknown[]).filter((id): id is string => typeof id === "string" && nodes.includes(id)))] : undefined, note: typeof r.note === "string" ? r.note.slice(0, 300) : "",
    });
  }
  return out;
}
