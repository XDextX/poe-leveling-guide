/* Clasificación de stats en daño, defensa u otros (aproximada, por palabras clave) y los cálculos que dependen de ella. */

import { MASTERIES, NODE, NODES } from "./data";

// Lo defensivo se mira primero porque "damage taken" también dice "damage".
const DEF_RE = /maximum Life|Life Regenerat|Life Recovery|Leech|Energy Shield|Armour|Evasion|Resist|Block|Suppress|damage taken|less Damage|Avoid|Recover|Regenerat|Flask|Fortify|Stun|Endurance Charge|Damage Reduction/i;
const DMG_RE = /Damage|Critical|Attack Speed|Cast Speed|Accuracy|Penetrat|Projectile|Area of Effect|Multiplier|Impale|Bleed|Poison|Ignite|Shock|Freeze|Chill|Onslaught|Frenzy Charge|Power Charge|Wither/i;
export const statKind = (line: string): StatKind => DEF_RE.test(line) ? "def" : DMG_RE.test(line) ? "dmg" : "other";
export const KIND_ES: Record<StatKind, string> = { dmg: "Daño", def: "Defensa", other: "Otros" };

/** Stats de los nodos cogidos (más maestrías), sumando las líneas iguales: "+10 to Dexterity" ×3 → "+30 to Dexterity". */
export function treeStats(tree: BuildTree): Record<StatKind, { text: string; n: number }[]> {
  const lines: string[] = [];
  for (const id of tree.nodes) { const n = NODES[id]; if (n.type !== NODE.MASTERY) lines.push(...n.stats); }
  for (const [node, effect] of tree.masteries) { const s = MASTERIES[node]?.[effect]; if (s) lines.push(...s.split("\n")); }
  const sums = new Map<string, { n: number; nums: number[] }>();
  for (const line of lines) {
    const key = line.replace(/\d+(\.\d+)?/g, "#");
    const nums = (line.match(/\d+(\.\d+)?/g) || []).map(Number);
    const prev = sums.get(key);
    if (prev) { prev.n++; prev.nums = prev.nums.map((v, i) => v + (nums[i] || 0)); } else sums.set(key, { n: 1, nums });
  }
  const out: Record<StatKind, { text: string; n: number }[]> = { dmg: [], def: [], other: [] };
  for (const [key, { n, nums }] of sums) {
    let i = 0;
    const text = key.replace(/#/g, () => { const v = nums[i++]; return Number.isInteger(v) ? String(v) : v.toFixed(1); });
    out[statKind(key)].push({ text, n });
  }
  for (const k of ["dmg", "def", "other"] as const) out[k].sort((a, b) => b.n - a.n);
  return out;
}

/** Puntuación de daño y defensa de un nodo (nº de líneas de cada tipo; los notables y keystones pesan más). */
export function nodeScore(id: string): { dmg: number; def: number } {
  const n = NODES[id], w = n.type === NODE.KEYSTONE ? 3 : n.type === NODE.NOTABLE ? 2 : 1, s = { dmg: 0, def: 0 };
  for (const line of n.stats) { const k = statKind(line); if (k !== "other") s[k] += w; }
  return s;
}

/** Tipo dominante de un nodo para la lista de indispensables. */
export function nodeKind(id: string): StatKind | "keystone" {
  if (NODES[id].type === NODE.KEYSTONE) return "keystone";
  const s = nodeScore(id);
  return s.def > s.dmg ? "def" : s.dmg > s.def ? "dmg" : "other";
}

// Grupos de stats para la prioridad del equipo; una pieza cuenta una vez por grupo aunque tenga varias líneas de él.
const GEAR_STATS: [label: string, re: RegExp][] = [["Vida máxima", /to maximum Life|increased maximum Life/i], ["Resistencias elementales", /(Fire|Cold|Lightning|all Elemental) Resistance/i],
  ["Resistencia al caos", /Chaos Resistance/i], ["Supresión de hechizos", /Suppress Spell Damage/i], ["Evasión / Escudo de energía", /Evasion|Energy Shield/i],
  ["Armadura", /\bArmour\b/i], ["Atributos", /to (Strength|Dexterity|Intelligence|all Attributes)/i], ["Crítico", /Critical Strike/i],
  ["Velocidad de ataque", /Attack Speed/i], ["Daño añadido", /^Adds \d+ to \d+/i], ["Velocidad de movimiento", /Movement Speed/i],
  ["Maná y reserva", /Mana|Reservation/i], ["Vida por golpe / robo de vida", /Life (per Enemy Hit|Leech)|Leeches/i]];

/** Cuántas piezas llevan cada grupo de stats, de más a menos; sin los grupos que no lleva ninguna. */
export const gearStatCounts = (pieces: Item[]): [label: string, n: number][] => GEAR_STATS.map(([label, re]): [string, number] => [label, pieces.filter(p => p.mods.some(m => re.test(m))).length])
  .filter(([, n]) => n).sort((a, b) => b[1] - a[1]);

const SLOT_ES: Record<string, string> = { "Weapon 1": "Arma", "Weapon 2": "Mano secundaria", "Weapon 1 Swap": "Arma (cambio)", "Weapon 2 Swap": "Mano sec. (cambio)",
  "Body Armour": "Armadura", Helmet: "Casco", Gloves: "Guantes", Boots: "Botas", Belt: "Cinturón", "Ring 1": "Anillo", "Ring 2": "Anillo",
  Amulet: "Amuleto", Jewel: "Joya del árbol" };
export const slotEs = (s: string): string => SLOT_ES[s] || (s.startsWith("Flask") ? "Frasco" : s.includes("Abyssal") ? "Joya abisal" : s);
