/* Ruta de campaña (formato de exile-leveling): parseo, traducción de los verbos y pintado de sus marcas {tipo|args}. */

import { AREAS, QUESTS, ROUTE } from "./data";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
/** Texto escapado para meterlo en el HTML de la ruta (los pasos y sus marcas se generan como HTML). */
export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ESCAPES[c]);

/** Opciones de la ruta para una build: qué hacer con los bandidos y si es inicio de liga. */
export function routeDefs(build: Build, leagueStart: boolean): Set<string> {
  const defs = new Set<string>(["BANDIT_" + (build.bandit === "None" ? "KILL" : build.bandit.toUpperCase())]);
  if (leagueStart) defs.add("LEAGUE_START");
  return defs;
}

/** Texto de la ruta → pasos [{ act, line, notes }], aplicando #ifdef/#ifndef con las opciones dadas. */
export function parseRoute(defs: Set<string>): RouteStep[] {
  const steps: RouteStep[] = [], stack: boolean[] = [];
  let act = 0;
  for (const raw of ROUTE.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#ifdef ")) { stack.push(defs.has(line.slice(7).trim())); continue; }
    if (line.startsWith("#ifndef ")) { stack.push(!defs.has(line.slice(8).trim())); continue; }
    if (line === "#endif") { stack.pop(); continue; }
    if (!stack.every(Boolean)) continue;
    if (line.startsWith("#section")) { act = +line.replace(/\D+/g, "") || act; continue; }
    if (line.startsWith("#sub")) { steps.at(-1)?.notes.push(line.slice(4).trim()); continue; }
    if (line.startsWith("#")) continue;
    steps.push({ act, line: line.replace(/\s+#.*$/, ""), notes: [] });
  }
  return steps;
}

/** Argumentos de una marca {quest|id|oferta…} → la misión y sus ofertas (todas si la marca no las nombra). */
export function questOffers([qid, ...named]: string[]): { quest: Quest; offers: Offer[] } | null {
  const quest = QUESTS[qid];
  if (!quest) return null;
  return { quest, offers: (named.length ? named : Object.keys(quest.offers)).map(oid => quest.offers[oid]).filter((o): o is Offer => !!o) };
}

// Los verbos con que empiezan los pasos; el resto del texto de la ruta queda en inglés, como en el original.
const VERBS: [en: string, es: string][] = [["Find and kill ", "Busca y mata a "], ["Find and Kill ", "Busca y mata a "], ["Find and take ", "Busca y coge "],
  ["Find and help ", "Busca y ayuda a "], ["Help and talk ", "Ayuda y habla "], ["Hand in ", "Entrega "], ["Talk to ", "Habla con "],
  ["Complete ", "Completa "], ["Get ", "Consigue "], ["Kill ", "Mata a "], ["Find ", "Busca "], ["Take the ", "Coge el "], ["Take ", "Coge "],
  ["Poison the ", "Envenena el "], ["Activate ", "Activa "], ["Help ", "Ayuda a "], ["Select ", "Elige "], ["Place ", "Coloca "],
  ["Open ", "Abre "], ["Light the ", "Enciende el "], ["Free ", "Libera a "], ["Burn the ", "Quema el "], ["Break ", "Rompe "], ["Before ", "Antes de "]];
const translate = (s: string): string => { for (const [en, es] of VERBS) if (s.startsWith(en)) return es + s.slice(en.length).replace(/, take /g, ", coge ").replace(/, kill /g, ", mata a "); return s; };

const minLevel = (level: number): number => Math.max(1, level - (3 + Math.floor(level / 16)));
const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
const arrow = (degrees: string): string => ARROWS[Math.round(+degrees / 45) % 8];
const LAB: Record<string, string> = { normal: "1_Labyrinth_boss_3", cruel: "2_Labyrinth_boss_3", merciless: "3_Labyrinth_boss_3", eternal: "EndGame_Labyrinth_boss_3" };
const LAB_ES: Record<string, string> = { normal: "normal", cruel: "cruel", merciless: "despiadado", eternal: "eterno" };
const lvlTag = (level: number): string => `<span class="lvl">nv ${minLevel(level)}+</span>`;
const areaHtml = (id: string): string => { const a = AREAS[id]; if (!a) return esc(id); return `<span class="area">${esc(a.name)}</span>${a.town ? "" : lvlTag(a.level)}`; };

/** Estado del recorrido de la ruta: la zona actual, dónde se puso el portal y qué hacer en cada entrega de misión. */
export interface RouteCtx { here: string; portalFrom: string | null; onQuest: (args: string[]) => string }

/**
 * Cómo se pinta cada marca de la ruta. `ctx` lleva la zona actual (para Logout, Portal y recetas) y `onQuest`, que decide
 * las gemas de cada entrega. Una marca nueva se añade aquí sin tocar el recorrido.
 */
const TOKENS: Record<string, (args: string[], ctx: RouteCtx) => string> = {
  enter: ([id], ctx) => { ctx.here = id; return areaHtml(id); },
  area: ([id]) => areaHtml(id),
  arena: ([name]) => `<span class="area">${esc(name)}</span>`,
  kill: ([name]) => `<span class="kill">${esc(name)}</span>`,
  quest_text: ([text]) => `<span class="qtext">${esc(text)}</span>`,
  generic: ([text]) => `<b>${esc(text)}</b>`,
  dir: ([deg]) => `<span class="dir" title="${esc(deg)}°">${arrow(deg)}</span>`,
  trial: () => `<span class="tag">Prueba de Ascendencia</span>`,
  waypoint_get: () => `<span class="wp">el Waypoint</span>`,
  waypoint: ([id], ctx) => {
    if (!id) return `<span class="wp">Waypoint</span>`;
    const from = AREAS[ctx.here], to = AREAS[id];
    ctx.here = id;
    const extra = from && to && from.act !== to.act ? ` <span class="lvl">acto ${to.act}</span>` : "";
    return `<span class="wp">Waypoint</span> ➞ ${areaHtml(id)}${extra}`;
  },
  logout: (_, ctx) => { const a = AREAS[ctx.here]; if (a && !a.town) ctx.here = a.townId ?? ctx.here; return `<b>Logout</b> ➞ ${areaHtml(ctx.here)}`; },
  portal: ([how], ctx) => {
    if (how === "set") { ctx.portalFrom = ctx.here; return `<b>Portal</b>`; }
    const a = AREAS[ctx.here];
    ctx.here = a && a.town && ctx.portalFrom ? ctx.portalFrom : (a ? a.townId || ctx.here : ctx.here);
    return `<b>Portal</b> ➞ ${areaHtml(ctx.here)}`;
  },
  crafting: ([id], ctx) => {
    const recipes = AREAS[id || ctx.here]?.recipes || [];
    return recipes.length ? `<b>receta de crafteo</b>: ${esc(recipes.join(", "))}` : "<b>receta de crafteo</b>";
  },
  ascend: ([version]) => { const lab = AREAS[LAB[version]]; return `<span class="tag">Asciende</span> en el Laberinto ${LAB_ES[version] || esc(version)}${lab ? lvlTag(lab.level) : ""}`; },
  quest: (args, ctx) => ctx.onQuest(args),
};

/** Pinta una línea de la ruta: traduce el verbo y sustituye cada marca por su HTML. */
export const renderLine = (line: string, ctx: RouteCtx): string => translate(line).replace(/\{([a-z_]+)(?:\|([^}]*))?\}/g, (_, type: string, arg: string = "") =>
  TOKENS[type] ? TOKENS[type](arg.split("|"), ctx) : esc(arg || type));

/** Las notas (#sub) son texto: se traducen los verbos, se dibujan las flechas y del resto de marcas queda su texto. */
export const renderNote = (note: string): string => translate(note).replace(/\{dir\|(\d+)\}/g, (_, d: string) => `<span class="dir">${arrow(d)}</span>`).replace(/\{[a-z_]+\|([^}]*)\}/g, "$1");
