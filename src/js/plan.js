/* Qué gema se consigue en cada paso de la ruta: una recompensa por oferta de misión y compras en cuanto se venden. */

/**
 * Recorre la ruta: pinta cada paso y, en cada entrega de misión, elige una recompensa y compra lo que ya esté a la venta.
 * Devuelve el HTML por paso y qué gemas se consiguieron dónde.
 */
function walk(steps, cls, want) {
  const bit = 1 << CLASSES.indexOf(cls), got = new Map();
  const ctx = { here: "1_1_1", portalFrom: null, onQuest: null };
  const out = steps.map(step => {
    const gems = [];
    ctx.onQuest = args => {
      const found = questOffers(args);
      if (!found) return esc(args[0]);
      const npcs = new Set();
      for (const { npc, rewards, vendor } of found.offers) {
        if (npc) npcs.add(npc);
        const open = want.filter(id => !got.has(id));
        const sold = id => vendor[id] && vendor[id][0] & bit;
        const canReward = open.filter(id => rewards[id] & bit);
        // Mejor gastar la recompensa gratuita en una gema que este mismo vendedor no venda.
        const reward = canReward.find(id => !sold(id)) || canReward[0] || null;
        const buys = {};
        for (const id of open) if (id !== reward && sold(id)) (buys[vendor[id][1]] ??= []).push(id);
        const at = { act: step.act, quest: found.quest.name };
        if (reward) { got.set(reward, at); gems.push({ how: "Recompensa", npc, ids: [reward] }); }
        for (const [who, ids] of Object.entries(buys)) { ids.forEach(id => got.set(id, at)); gems.push({ how: "Comprar a " + who, ids, buy: true }); }
      }
      return `<span class="questname">${esc(found.quest.name)}</span>${npcs.size ? ` · ${esc([...npcs].join(", "))}` : ""}`;
    };
    return { act: step.act, text: renderLine(step.line, ctx), notes: step.notes, gems };
  });
  return { out, got };
}

/**
 * Ruta y gemas para una build; la Biblioteca (Siosa) solo se incluye si aporta alguna gema.
 * `extra` son las gemas de leveling sugeridas: van detrás, así que si una recompensa sirve para ambas gana la de la build.
 */
function plan(build, cls, leagueStart, extra = []) {
  const want = [];
  for (const g of build.gems) {
    if (g.kind === "normal") want.push(g.id);
    if ((g.kind === "vaal" || g.kind === "transfigured") && g.base && !want.includes(g.base)) want.push(g.base);
  }
  for (const id of extra) if (!want.includes(id)) want.push(id);
  const start = (START[cls] || []).filter(id => want.includes(id));
  const rest = want.filter(id => !start.includes(id));
  const defs = routeDefs(build, leagueStart);
  let result = walk(parseRoute(new Set([...defs, "LIBRARY"])), cls, rest);
  if (![...result.got.values()].some(v => v.quest === "A Fixture of Fate")) result = walk(parseRoute(defs), cls, rest);
  start.forEach(id => result.got.set(id, { act: 1, quest: "Inicio" }));
  return { ...result, start, missing: rest.filter(id => !result.got.has(id)) };
}
