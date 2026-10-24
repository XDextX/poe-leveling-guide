/* Datos del juego (gamedata/*.js los dejan en window.DATA, con campos por posición para que ocupen poco) y utilidades comunes. */

/** Elemento de la página por id. Todos los que se piden existen en index.html; T afina el tipo (textarea, input…). */
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
/** Los controles del formulario, con su tipo exacto. */
const form = {
  code: $<HTMLTextAreaElement>("code"), cls: $<HTMLSelectElement>("cls"),
  league: $<HTMLInputElement>("league"), zones: $<HTMLInputElement>("zones"),
};

// Si alguien copia solo index.html, sin la carpeta gamedata/, se dice qué falta en vez de dejar la página rota en silencio.
const MISSING = ["CLASSES", "G", "K", "Q", "A", "START", "ROUTE", "T"].filter(k => !(window.DATA && k in window.DATA));
if (MISSING.length) {
  $("msg").className = "error";
  $("msg").textContent = "Faltan los datos del juego: la carpeta gamedata/ tiene que estar junto a index.html. Copia la carpeta entera de la app.";
  $<HTMLButtonElement>("go").disabled = true;
  throw new Error("Faltan datos en window.DATA: " + MISSING.join(", "));
}
// Comprobado justo arriba: están todas las claves.
const RAW = window.DATA as GameDataRaw;

const mapValues = <V, R>(obj: Record<string, V>, fn: (v: V, k: string) => R): Record<string, R> =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));

const { CLASSES, ROUTE, START } = RAW;
const GEMS = mapValues<GemRow, Gem>(RAW.G, ([name, attr, level]) => ({ name, attr, level }));
const QUESTS = mapValues<QuestRaw, Quest>(RAW.Q, ({ n, o }) => ({ name: n, offers: mapValues<OfferRow, Offer>(o, ([npc, rewards, vendor]) => ({ npc, rewards, vendor })) }));
const AREAS = mapValues<AreaRow, Area>(RAW.A, ([name, act, level, town, townId, recipes]) => ({ name, act, level, town: !!town, townId, recipes }));
// Etiquetas de RePoE; `allowed`/`excluded` solo existen en los soportes y van en notación polaca inversa.
const SKILLS = mapValues<SkillRow, Skill>(RAW.K, ([tags, types, weapons, allowed, excluded]) => ({ tags, types, weapons, allowed, excluded }));
const NODE = { SMALL: 0, NOTABLE: 1, KEYSTONE: 2, MASTERY: 3, JEWEL: 4, START: 5 } as const;
const NODES = mapValues<NodeRow, TreeNode>(RAW.T.nodes, ([x, y, type, name, stats, ascendancy, reminder, icon]) => ({ x, y, type, name, stats: stats ? stats.split("\n") : [], ascendancy, reminder: reminder ? reminder.split("\n") : [], icon }));
const EDGES = RAW.T.edges, MASTERIES = RAW.T.masteries, CLASS_STARTS = RAW.T.starts, SHEETS = RAW.T.sheets;

const isSupport = (id: string): boolean => (SKILLS[id]?.allowed.length ?? 0) > 0;
const isActive = (id: string): boolean => !!SKILLS[id] && !isSupport(id);

// Nombre en minúsculas → id; PoB omite " Support" en las gemas de soporte, así que se registran ambas formas.
const byName = new Map<string, string>();
for (const [id, g] of Object.entries(GEMS)) {
  const n = g.name.toLowerCase();
  if (!byName.has(n)) byName.set(n, id);
  if (n.endsWith(" support") && !byName.has(n.slice(0, -8))) byName.set(n.slice(0, -8), id);
}

/** Coste en el vendedor según el nivel requerido de la gema. */
const cost = (level: number): string => level < 8 ? "Scroll of Wisdom" : level < 16 ? "Orb of Transmutation" : level < 28 ? "Orb of Alteration" : level < 38 ? "Orb of Chance" : "Orb of Alchemy";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ESCAPES[c]);
/** Error con un mensaje pensado para el usuario (los del navegador no lo son). */
type UserError = Error & { own: true };
const userError = (msg: string): UserError => Object.assign(new Error(msg), { own: true as const });
const isUserError = (e: unknown): e is UserError => e instanceof Error && (e as Partial<UserError>).own === true;
