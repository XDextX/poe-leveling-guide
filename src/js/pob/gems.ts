/* Las gemas de la build: de los <Gem> de PoB a ids de nuestros datos, la habilidad principal y el tipo de cada gema. */

import { GEMS } from "../data";
import { isActive, isSupport } from "../gems";

// Nombre en minúsculas → id, para las gemas que PoB da por nombre. PoB omite " Support" en las de soporte, así que se
// registran ambas formas.
const byName = new Map<string, string>();
for (const [id, g] of Object.entries(GEMS)) {
  const n = g.name.toLowerCase();
  if (!byName.has(n)) byName.set(n, id);
  if (n.endsWith(" support") && !byName.has(n.slice(0, -8))) byName.set(n.slice(0, -8), id);
}

/** Id de la gema de un <Gem>: su gemId si lo conocemos y, si no, su nombre. */
function gemIdOf(el: Element): string | null {
  const id = (el.getAttribute("gemId") || "").replace("Metadata/Items/Gems/", "");
  return GEMS[id] ? id : byName.get((el.getAttribute("nameSpec") || "").trim().toLowerCase()) || null;
}

/** Tipo de gema: normal (se busca en la ruta), vaal, transfigurada, despertada u otra (sin datos). */
function classify(name: string, id: string | null): BuildGem {
  const lower = name.toLowerCase();
  if (lower.startsWith("awakened ")) return { name, id, kind: "awakened" };
  if (lower.startsWith("vaal ")) return { name, id, kind: "vaal", base: byName.get(lower.slice(5)) };
  // "Herald of Ice" existe tal cual; "Ice Nova of Frostbolts" no, pero "Ice Nova" sí: es transfigurada.
  const m = /^(.+?) of /i.exec(name);
  if (!byName.has(lower) && m && byName.has(m[1].toLowerCase())) return { name, id: null, kind: "transfigured", base: byName.get(m[1].toLowerCase()) };
  return { name, id, kind: id ? "normal" : "unknown" };
}

/** Las gemas de la build, sin repetir (por nombre). */
export function parseGems(doc: Document): BuildGem[] {
  const gems: BuildGem[] = [], seen = new Set<string>();
  for (const el of doc.querySelectorAll("Skills Gem")) {
    const spec = (el.getAttribute("nameSpec") || "").trim();
    const id = gemIdOf(el);
    const name = spec || (id && GEMS[id].name);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    gems.push(classify(name, id));
  }
  return gems;
}

/** Habilidad principal: la primera gema activa del grupo que Path of Building marca como principal, con sus soportes. */
export function mainSkill(doc: Document): MainSkill | null {
  const set = doc.querySelector(`Skills > SkillSet[id="${doc.querySelector("Skills")?.getAttribute("activeSkillSet")}"]`) || doc.querySelector("Skills > SkillSet") || doc.querySelector("Skills");
  const groups = [...(set?.querySelectorAll(":scope > Skill") || [])];
  const group = groups[(Number(doc.querySelector("Build")?.getAttribute("mainSocketGroup")) || 1) - 1] || groups[0];
  const ids = [...(group?.querySelectorAll("Gem") || [])].map(gemIdOf).filter((id): id is string => !!id);
  const active = ids.find(isActive);
  return active ? { id: active, supports: ids.filter(id => id !== active && isSupport(id)) } : null;
}
