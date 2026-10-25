/* Avance del jugador frente a la guía: cuántas gemas lleva por acto y qué le falta. Sin interfaz. */

/** Gemas conseguidas y totales de un acto de la ruta. */
export interface ActProgress { act: number; total: number; done: number }
/** Gemas pendientes que se consiguen en un mismo sitio (misión o inicio) de un acto. */
export interface PendingGroup { act: number; quest: string; ids: string[] }

/** Todas las gemas que da la ruta, con el acto y la misión en que se consiguen; las del inicio cuentan en el acto 1. */
function sources(plan: Plan): { id: string; act: number; quest: string }[] {
  return [...plan.start.map(id => ({ id, act: 1, quest: "Al empezar" })), ...[...plan.got].map(([id, { act, quest }]) => ({ id, act, quest }))];
}

/** Por acto, cuántas de sus gemas están marcadas como conseguidas; solo los actos que dan alguna. */
export function progressByAct(plan: Plan, done: Set<string>): ActProgress[] {
  const acts = new Map<number, ActProgress>();
  for (const { id, act } of sources(plan)) {
    const a = acts.get(act) ?? { act, total: 0, done: 0 };
    a.total++; if (done.has(id)) a.done++;
    acts.set(act, a);
  }
  return [...acts.values()].sort((a, b) => a.act - b.act);
}

/** Gemas sin marcar que se consiguen entre los actos `from` y `to` (incluidos), agrupadas por acto y misión, en el orden de la ruta. */
export function pendingGems(plan: Plan, done: Set<string>, from: number, to: number): PendingGroup[] {
  const groups = new Map<string, PendingGroup>();
  for (const { id, act, quest } of sources(plan)) {
    if (act < from || act > to || done.has(id)) continue;
    const key = act + "|" + quest, g = groups.get(key) ?? { act, quest, ids: [] };
    g.ids.push(id); groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => a.act - b.act);
}
