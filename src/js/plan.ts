/* Qué gema se consigue en cada paso de la ruta: una recompensa por oferta de misión y compras en cuanto se venden. */

import { CLASSES, START } from "./data";
import { esc, parseRoute, questOffers, renderLine, routeDefs } from "./route";
import type { RouteCtx } from "./route";

/** Líneas de la ruta que cambian de zona; {portal|set} (poner el portal) y {waypoint} sin destino (cogerlo) no. */
const ENTERS_ZONE = /^(?:➞ )?\{(?:enter|logout)[|}]|^\{waypoint\|[^}]|^\{portal\|(?!set)/i;

/**
 * Recorre la ruta: pinta cada paso y, en cada entrega de misión, elige una recompensa y compra lo que ya esté a la venta.
 * Devuelve el HTML por paso y qué gemas se consiguieron dónde.
 */
function walk(steps: RouteStep[], cls: string, want: string[]): { out: PlannedStep[]; got: Map<string, GotAt> } {
  const bit = 1 << CLASSES.indexOf(cls), got = new Map<string, GotAt>();
  const ctx: RouteCtx = { here: "1_1_1", portalFrom: null, onQuest: () => "" };
  const out = steps.map(step => {
    const gems: GemGroup[] = [];
    ctx.onQuest = (args: string[]) => {
      const found = questOffers(args);
      if (!found) return esc(args[0]);
      const npcs = new Set();
      for (const { npc, rewards, vendor } of found.offers) {
        if (npc) npcs.add(npc);
        const open = want.filter(id => !got.has(id));
        const sold = (id: string): boolean => !!vendor[id] && (vendor[id][0] & bit) !== 0;
        const canReward = open.filter(id => (rewards[id] & bit) !== 0);
        // Mejor gastar la recompensa gratuita en una gema que este mismo vendedor no venda.
        const reward = canReward.find(id => !sold(id)) || canReward[0] || null;
        const buys: Record<string, string[]> = {};
        for (const id of open) if (id !== reward && sold(id)) (buys[vendor[id][1]] ??= []).push(id);
        const at: GotAt = { act: step.act, quest: found.quest.name };
        if (reward) { got.set(reward, at); gems.push({ how: "Recompensa", npc, ids: [reward] }); }
        for (const [who, ids] of Object.entries(buys)) { ids.forEach(id => got.set(id, at)); gems.push({ how: "Comprar a " + who, ids, buy: true }); }
      }
      return `<span class="questname">${esc(found.quest.name)}</span>${npcs.size ? ` · ${esc([...npcs].join(", "))}` : ""}`;
    };
    return { act: step.act, text: renderLine(step.line, ctx), notes: step.notes, gems, zone: ENTERS_ZONE.test(step.line) };
  });
  return { out, got };
}

/**
 * Ruta y gemas para una build; la Biblioteca (Siosa) solo se incluye si aporta alguna gema.
 * `extra` son las gemas de leveling sugeridas: van detrás, así que si una recompensa sirve para ambas gana la de la build.
 */
export function plan(build: Build, cls: string, leagueStart: boolean, extra: string[] = []): Plan {
  const want: string[] = [];
  for (const gem of build.gems) {
    if (gem.kind === "normal" && gem.id) want.push(gem.id);
    if ((gem.kind === "vaal" || gem.kind === "transfigured") && gem.base && !want.includes(gem.base)) want.push(gem.base);
  }
  for (const id of extra) if (!want.includes(id)) want.push(id);
  const start = (START[cls] || []).filter(id => want.includes(id));
  const rest = want.filter(id => !start.includes(id));
  let result = walk(parseRoute(routeDefs(build, leagueStart, { library: true })), cls, rest);
  if (![...result.got.values()].some(v => v.quest === "A Fixture of Fate")) result = walk(parseRoute(routeDefs(build, leagueStart)), cls, rest);
  start.forEach(id => result.got.set(id, { act: 1, quest: "Inicio" }));
  return { ...result, start, missing: rest.filter(id => !result.got.has(id)) };
}
