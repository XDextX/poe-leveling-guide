/*
 * Conversión de los datos del juego tal como vienen en gamedata/*.js (campos por posición, para que ocupen poco) a objetos
 * con nombre. Función pura: no lee window, así que sirve igual en el navegador (data.ts) que en Node (pruebas, scripts).
 */

const mapValues = <V, R>(obj: Record<string, V>, fn: (v: V, k: string) => R): Record<string, R> =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));

/** Los datos del juego con nombre. EDGES, MASTERIES, CLASS_STARTS, SHEETS y UNIQUES ya tienen buena forma y van tal cual. */
export function decodeGameData(raw: GameDataRaw) {
  return {
    CLASSES: raw.CLASSES, ROUTE: raw.ROUTE, START: raw.START,
    GEMS: mapValues<GemRow, Gem>(raw.G, ([name, attr, level, icon]) => ({ name, attr, level, icon })),
    QUESTS: mapValues<QuestRaw, Quest>(raw.Q, ({ n, o }) => ({ name: n, offers: mapValues<OfferRow, Offer>(o, ([npc, rewards, vendor]) => ({ npc, rewards, vendor })) })),
    AREAS: mapValues<AreaRow, Area>(raw.A, ([name, act, level, town, townId, recipes]) => ({ name, act, level, town: !!town, townId, recipes })),
    // Etiquetas de RePoE; `allowed`/`excluded` solo existen en los soportes y van en notación polaca inversa.
    SKILLS: mapValues<SkillRow, Skill>(raw.K, ([tags, types, weapons, allowed, excluded]) => ({ tags, types, weapons, allowed, excluded })),
    NODES: mapValues<NodeRow, TreeNode>(raw.T.nodes, ([x, y, type, name, stats, ascendancy, reminder, icon]) =>
      ({ x, y, type, name, stats: stats ? stats.split("\n") : [], ascendancy, reminder: reminder ? reminder.split("\n") : [], icon })),
    EDGES: raw.T.edges, MASTERIES: raw.T.masteries, CLASS_STARTS: raw.T.starts, SHEETS: raw.T.sheets, UNIQUES: raw.U,
  };
}
