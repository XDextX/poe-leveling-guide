/* Sugerencias de leveling: heurísticas que la interfaz muestra siempre como "sugerencia automática". */

import { AREAS, CLASSES, CLASS_STARTS, EDGES, GEMS, NODES, SKILLS, START } from "./data";
import { isSupport } from "./gems";
import { elementFit, formFit } from "./damage";
import type { Damage } from "./damage";
import { isHex, isMark } from "./limits";
import { maxSockets } from "./sockets";
import { NODE } from "./node-types";
import { parseRoute, questOffers } from "./route";
import { statKind } from "./stats";

const STAGES: [first: number, last: number][] = [[1, 2], [3, 4], [5, 6], [7, 10]];
// Nivel aproximado al acabar un acto: el de la zona de más nivel de ese acto.
const actLevel = (act: number): number => Math.max(...Object.values(AREAS).filter(a => a.act === act && !a.town).map(a => a.level));

/** Primer acto de la ruta en que la clase puede conseguir cada gema (como recompensa o comprándola). */
function availability(cls: string, defs: Set<string>): Record<string, number> {
  const bit = 1 << CLASSES.indexOf(cls), avail: Record<string, number> = {};
  const mark = (id: string, act: number) => { if (!(id in avail)) avail[id] = act; };
  (START[cls] || []).forEach(id => mark(id, 1));
  for (const step of parseRoute(defs))
    for (const m of step.line.matchAll(/\{quest\|([^}]*)\}/g))
      for (const { rewards, vendor } of questOffers(m[1].split("|"))?.offers || []) {
        for (const [id, mk] of Object.entries(rewards)) if (mk & bit) mark(id, step.act);
        for (const [id, [mk]] of Object.entries(vendor)) if (mk & bit) mark(id, step.act);
      }
  return avail;
}

/** Evalúa una lista de tipos en notación polaca inversa (["Spell", "Totemable", "AND"]) contra los tipos de una habilidad. */
function rpn(expr: string[], types: string[]): boolean {
  const st: boolean[] = [];
  for (const t of expr) {
    if (t === "AND" || t === "OR") { const b = st.pop() ?? false, a = st.pop() ?? false; st.push(t === "AND" ? a && b : a || b); }
    else st.push(types.includes(t));
  }
  return st.some(Boolean);
}
const canSupport = (sup: string, skill: string): boolean => {
  const { allowed, excluded } = SKILLS[sup], types = SKILLS[skill].types;
  return allowed.length > 0 && rpn(allowed, types) && !(excluded.length && rpn(excluded, types));
};
const similarity = (a: string, b: string): number => { const x = new Set(SKILLS[a].tags), y = SKILLS[b].tags; const inter = y.filter(t => x.has(t)).length; return inter / (new Set([...x, ...y]).size || 1); };
// Cuánto pesa que el elemento de una gema encaje con el daño de la build, y que potencie su forma (veneno, ignite…), frente al parecido de etiquetas.
const FIT_WEIGHT = 0.5, FORM_WEIGHT = 0.6;
/** Ordena por parecido con la habilidad principal más cuánto encaja su elemento con el daño de la build y, a igualdad, por nivel (la más avanzada primero). */
const byLikeness = (mainId: string, damage: Damage) => {
  const score = (id: string) => similarity(mainId, id) + FIT_WEIGHT * elementFit(id, damage.profile) + FORM_WEIGHT * formFit(id, damage.form);
  return (a: string, b: string): number => score(b) - score(a) || GEMS[b].level - GEMS[a].level;
};
// Habilidades que no sirven para matar mientras subes, salvo que la build principal también sea de ese tipo.
const UTILITY_TAGS = ["aura", "herald", "movement", "travel", "blink", "guard", "warcry", "curse", "mark", "link", "banner", "golem", "stance", "vaal", "minion", "totem", "trap", "mine", "brand", "trigger"];

/**
 * Por cada tramo de la campaña: nivel, habilidad sugerida (o la de la build) y soportes compatibles, por orden.
 * damage: los elementos y la forma de daño de la build, para preferir sustitutas y soportes de sus elementos y que potencien su forma.
 * secondary: es una habilidad más de la build, no la principal. Esas solo se sustituyen si son una maldición o una marca (por otra
 * del mismo tipo, que sí hace lo mismo) y solo llevan los soportes que ya tiene la build: un parecido de etiquetas no basta para
 * inventar un sustituto de un buff o un aura (Blood Rage por un hechizo de fuego).
 */
export function suggestSkills(main: MainSkill, cls: string, defs: Set<string>, damage: Damage, secondary = false): StageSkill[] {
  const avail = availability(cls, defs), mainSkill = SKILLS[main.id], mainTags = new Set(mainSkill.tags);
  const isAttack = mainSkill.types.includes("Attack"), isSpell = mainSkill.types.includes("Spell");
  const skillOk = (id: string): boolean => {
    const { tags, types, weapons } = SKILLS[id];
    if (isSupport(id) || !(id in avail)) return false;
    if (secondary && (!(isHex(main.id) || isMark(main.id)) || isHex(id) !== isHex(main.id) || isMark(id) !== isMark(main.id))) return false;
    if (types.includes("Attack") !== isAttack || types.includes("Spell") !== isSpell) return false;
    if (tags.some(t => UTILITY_TAGS.includes(t) && !mainTags.has(t))) return false;
    return !(mainSkill.weapons.length && weapons.length && !weapons.some(w => mainSkill.weapons.includes(w)));
  };
  const out: StageSkill[] = [];
  let from = 1, prev: string | null = null;
  for (const [first, last] of STAGES) {
    const to = actLevel(last), usable = from + 4;
    let skill: string | null = null, own = false;
    if (avail[main.id] <= first && GEMS[main.id].level <= usable) { skill = main.id; own = true; }
    else skill = Object.keys(SKILLS).filter(id => skillOk(id) && avail[id] <= first && GEMS[id].level <= usable).sort(byLikeness(main.id, damage))[0] || prev;
    let supports: string[] = [];
    if (skill) {
      const ok = (id: string): boolean => SKILLS[id] && id in avail && avail[id] <= last && GEMS[id].level <= to && canSupport(id, skill);
      const fromBuild = main.supports.filter(ok);
      const others = Object.keys(SKILLS).filter(id => isSupport(id) && ok(id) && !fromBuild.includes(id) && !SKILLS[id].tags.includes("vaal")).sort(byLikeness(main.id, damage));
      // La habilidad y sus soportes tienen que caber en las casillas que da el nivel de los objetos de este tramo.
      supports = (secondary ? fromBuild : [...fromBuild, ...others]).slice(0, maxSockets(to) - 1);
    }
    out.push({ acts: [first, last], from, to, skill, own, supports, links: maxSockets(to), mainAt: !own && avail[main.id] <= last ? Math.max(GEMS[main.id].level, from) : null });
    prev = skill; from = to;
  }
  return out;
}

// Vecinos de cada nodo del árbol, en los dos sentidos.
const ADJ = new Map<string, string[]>();
for (let i = 0; i < EDGES.length; i += 2) {
  const a = String(EDGES[i]), b = String(EDGES[i + 1]);
  ADJ.has(a) || ADJ.set(a, []); ADJ.has(b) || ADJ.set(b, []);
  ADJ.get(a)!.push(b); ADJ.get(b)!.push(a);
}

/** Valor de un nodo para el árbol de leveling en el tramo `si`: la defensa pesa más al principio. */
function levelingValue(id: string, si: number): number {
  const n = NODES[id], defW = [1.5, 1.3, 1.1, 1][si];
  // Las keystones definen la build final pero suelen tener un coste (Perfect Agony quita el daño extra de los críticos):
  // casi no cuentan hasta el último tramo.
  const base = n.type === NODE.KEYSTONE ? (si === STAGES.length - 1 ? 4 : 0.1) : n.type === NODE.NOTABLE ? 3 : n.type === NODE.JEWEL ? 0.3 : 1;
  if (!n.stats.length) return 0.2;
  let v = 0;
  for (const line of n.stats) { const k = statKind(line); v += k === "def" ? defW : k === "dmg" ? 1 : 0.5; if (/maximum Life/i.test(line)) v += 1; }
  return base * v;
}

/** Camino más corto (por nodos del árbol final aún no cogidos) desde lo ya cogido hasta cada nodo alcanzable: nodo → nodo anterior. */
function reachable(taken: Set<string>, final: Set<string>): Map<string, string> {
  const parent = new Map<string, string>(), queue = [...taken], seen = new Set(taken);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of ADJ.get(cur) || []) if (final.has(nb) && !seen.has(nb)) { seen.add(nb); parent.set(nb, cur); queue.push(nb); }
  }
  return parent;
}

/**
 * Árbol de leveling sugerido: crece desde el inicio de la clase solo por nodos del árbol final y, en cada paso,
 * coge el camino que más aporta por punto gastado. Puntos por tramo ≈ nivel − 1 + puntos de misión (≈22 en la campaña, +2 si se matan los bandidos).
 */
export function suggestTrees(tree: BuildTree, killBandits: boolean): TreeStage[] {
  const start = tree.classId ? CLASS_STARTS[tree.classId] : undefined;
  if (!start) return [];
  const final = new Set(tree.nodes.filter(id => NODES[id].type !== NODE.MASTERY && !NODES[id].ascendancy && id !== start));
  const taken = new Set([start]), out: TreeStage[] = [];
  for (const [si, [, last]] of STAGES.entries()) {
    const level = actLevel(last), points = level - 1 + Math.round(22 * last / 10) + (killBandits && last >= 2 ? 2 : 0);
    let budget = points - (taken.size - 1);
    while (budget > 0) {
      const parent = reachable(taken, final);
      let best: { score: number; path: string[] } | null = null;
      for (const t of parent.keys()) {
        const path: string[] = [];
        for (let c = t; !taken.has(c); c = parent.get(c)!) path.push(c);
        if (path.length > budget) continue;
        const score = path.reduce((s, id) => s + levelingValue(id, si), 0) / path.length;
        if (!best || score > best.score) best = { score, path };
      }
      if (!best) break;
      best.path.forEach(id => taken.add(id));
      budget -= best.path.length;
    }
    out.push({ title: `Actos ${STAGES[si][0]}-${last}`, level, points, nodes: [...taken].filter(id => id !== start) });
  }
  return out;
}
