/* Datos del juego (los genera scripts/build.js en DATA, con campos por posición para que ocupen poco) y utilidades comunes. */

const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));

const { CLASSES, ROUTE, START } = DATA;
const GEMS = mapValues(DATA.G, ([name, attr, level]) => ({ name, attr, level }));
const QUESTS = mapValues(DATA.Q, ({ n, o }) => ({ name: n, offers: mapValues(o, ([npc, rewards, vendor]) => ({ npc, rewards, vendor })) }));
const AREAS = mapValues(DATA.A, ([name, act, level, town, townId, recipes]) => ({ name, act, level, town: !!town, townId, recipes }));
// Etiquetas de RePoE; `allowed`/`excluded` solo existen en los soportes y van en notación polaca inversa.
const SKILLS = mapValues(DATA.K, ([tags, types, weapons, allowed, excluded]) => ({ tags, types, weapons, allowed, excluded }));
const NODE = { SMALL: 0, NOTABLE: 1, KEYSTONE: 2, MASTERY: 3, JEWEL: 4, START: 5 };
const NODES = mapValues(DATA.T.nodes, ([x, y, type, name, stats, ascendancy]) => ({ x, y, type, name, stats: stats ? stats.split("\n") : [], ascendancy }));
const EDGES = DATA.T.edges, MASTERIES = DATA.T.masteries, CLASS_STARTS = DATA.T.starts;

const isSupport = id => SKILLS[id]?.allowed.length > 0;
const isActive = id => SKILLS[id] && !isSupport(id);

// Nombre en minúsculas → id; PoB omite " Support" en las gemas de soporte, así que se registran ambas formas.
const byName = new Map();
for (const [id, g] of Object.entries(GEMS)) {
  const n = g.name.toLowerCase();
  if (!byName.has(n)) byName.set(n, id);
  if (n.endsWith(" support") && !byName.has(n.slice(0, -8))) byName.set(n.slice(0, -8), id);
}

/** Coste en el vendedor según el nivel requerido de la gema. */
const cost = level => level < 8 ? "Scroll of Wisdom" : level < 16 ? "Orb of Transmutation" : level < 28 ? "Orb of Alteration" : level < 38 ? "Orb of Chance" : "Orb of Alchemy";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** Error con un mensaje pensado para el usuario (los del navegador no lo son). */
const userError = msg => Object.assign(new Error(msg), { own: true });
