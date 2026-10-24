/* Lectura del código de exportación de Path of Building: clase, gemas, habilidad principal, equipo y árbol. */

import { GEMS, NODES } from "./data";
import { userError } from "./errors";
import { isActive, isSupport } from "./gems";

// Nombre en minúsculas → id, para las gemas que PoB da por nombre. PoB omite " Support" en las de soporte, así que se
// registran ambas formas.
const byName = new Map<string, string>();
for (const [id, g] of Object.entries(GEMS)) {
  const n = g.name.toLowerCase();
  if (!byName.has(n)) byName.set(n, id);
  if (n.endsWith(" support") && !byName.has(n.slice(0, -8))) byName.set(n.slice(0, -8), id);
}

/** Código de PoB → XML: base64 "url-safe" comprimido con zlib. */
export async function decode(code: string): Promise<string> {
  let b64 = code.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - b64.length % 4) % 4);
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Response(stream).text();
}

/** XML de PoB → la build: clase, ascendencia, bandidos, gemas sin repetir, equipo, árbol y habilidad principal. */
export function parseBuild(xml: string): Build {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror") || !doc.querySelector("PathOfBuilding")) throw userError("no es un código de Path of Building");
  const b = doc.querySelector("Build");
  const gems: BuildGem[] = [], seen = new Set<string>();
  for (const el of doc.querySelectorAll("Skills Gem")) {
    const spec = (el.getAttribute("nameSpec") || "").trim();
    const id = gemIdOf(el);
    const name = spec || (id && GEMS[id].name);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    gems.push(classify(name, id));
  }
  return { cls: b?.getAttribute("className") ?? null, ascend: b?.getAttribute("ascendClassName") ?? null, bandit: b?.getAttribute("bandit") || "None",
    gems, items: parseItems(doc), tree: parseTree(doc), main: mainSkill(doc) };
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

/** El <Spec> (árbol) que la build tiene activo y todos los demás. */
function treeSpecs(doc: Document): { active: Element | undefined; all: Element[] } {
  const specs = [...doc.querySelectorAll("Tree > Spec")];
  const active = specs[(Number(doc.querySelector("Tree")?.getAttribute("activeSpec")) || 1) - 1] || specs[0];
  return { active, all: specs };
}

/**
 * Árbol activo → { nodes, masteries, classId, stages }; los nodos de joyas cluster no están en el árbol base y se ignoran.
 * stages son los demás árboles de la build, si el autor los incluyó (suelen ser los de leveling): [{ title, nodes }].
 */
function parseTree(doc: Document): BuildTree {
  const { active: spec, all } = treeSpecs(doc);
  if (!spec) return { nodes: [], masteries: [], classId: null, stages: [] };
  const nodesOf = (s: Element) => (s.getAttribute("nodes") || "").split(",").filter(id => NODES[id]);
  const masteries = [...(spec.getAttribute("masteryEffects") || "").matchAll(/\{(\d+),(\d+)\}/g)].map((m): [string, string] => [m[1], m[2]]);
  const stages = all.length > 1 ? all.filter(s => s !== spec).map((s, i) => ({ title: s.getAttribute("title") || `Árbol ${i + 1}`, nodes: nodesOf(s) })) : [];
  return { nodes: nodesOf(spec), masteries, classId: spec.getAttribute("classId"), stages };
}

/** Habilidad principal: la primera gema activa del grupo que Path of Building marca como principal, con sus soportes. */
function mainSkill(doc: Document): MainSkill | null {
  const set = doc.querySelector(`Skills > SkillSet[id="${doc.querySelector("Skills")?.getAttribute("activeSkillSet")}"]`) || doc.querySelector("Skills > SkillSet") || doc.querySelector("Skills");
  const groups = [...(set?.querySelectorAll(":scope > Skill") || [])];
  const group = groups[(Number(doc.querySelector("Build")?.getAttribute("mainSocketGroup")) || 1) - 1] || groups[0];
  const ids = [...(group?.querySelectorAll("Gem") || [])].map(gemIdOf).filter((id): id is string => !!id);
  const active = ids.find(isActive);
  return active ? { id: active, supports: ids.filter(id => id !== active && isSupport(id)) } : null;
}

/**
 * Mod de PoB tal como se ve en el juego, o null si es de otra variante del único.
 * PoB guarda todas las variantes ({variant:1,2}) y los rangos con la tirada aparte ({range:0.3}(10-20)%).
 */
function modText(line: string, variant: string): string | null {
  const v = line.match(/\{variant:([\d,]+)\}/);
  if (v && variant && !v[1].split(",").includes(variant)) return null;
  const r = Number(line.match(/\{range:([\d.]+)\}/)?.[1] ?? NaN);
  let t = line.replace(/\{[^}]*\}/g, "").trim();
  // shortcut: redondeo simple al número de decimales del rango; PoB redondea igual en casi todos los mods.
  if (!isNaN(r)) t = t.replace(/\((-?[\d.]+)-(-?[\d.]+)\)/g, (_, a: string, b: string) => {
    const dec = Math.max(...[a, b].map(s => s.split(".")[1]?.length ?? 0));
    return String(+(+a + (+b - +a) * r).toFixed(dec));
  });
  return t || null;
}

/** Objetos equipados (conjunto activo) y joyas del árbol activo → [{ slot, rarity, name, base, req, mods, implicits }]; los primeros `implicits` mods son los implícitos. */
function parseItems(doc: Document): Item[] {
  const text = new Map([...doc.querySelectorAll("Items > Item")].map(el => [el.getAttribute("id") ?? "", el.textContent ?? ""]));
  const itemsEl = doc.querySelector("Items");
  const set = doc.querySelector(`ItemSet[id="${itemsEl?.getAttribute("activeItemSet")}"]`) || doc.querySelector("ItemSet") || itemsEl;
  const used: [slot: string, id: string][] = [];
  const take = (slot: string | null, id: string | null) => { if (slot && id && id !== "0") used.push([slot, id]); };
  set?.querySelectorAll(":scope > Slot").forEach(s => take(s.getAttribute("name"), s.getAttribute("itemId")));
  treeSpecs(doc).active?.querySelectorAll("Socket").forEach(s => take("Jewel", s.getAttribute("itemId")));
  return used.filter(([, id]) => text.has(id)).map(([slot, id]) => {
    const raw = text.get(id) ?? "", L = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const rarity = (L[0] || "").replace("Rarity: ", "");
    const named = rarity === "RARE" || rarity === "UNIQUE";
    const imp = L.findIndex(l => l.startsWith("Implicits:")), variant = (raw.match(/Selected Variant: (\d+)/) || [])[1] ?? "";
    const clean = (lines: string[]) => lines.map(l => modText(l, variant)).filter((t): t is string => !!t);
    const implicits = imp < 0 ? [] : clean(L.slice(imp + 1, imp + 1 + (+L[imp].slice(10) || 0)));
    const mods = imp < 0 ? [] : [...implicits, ...clean(L.slice(imp + 1 + (+L[imp].slice(10) || 0)))];
    return { slot, rarity, name: L[1] || "", base: named ? L[2] || "" : L[1] || "", req: +(raw.match(/LevelReq: (\d+)/) || [])[1] || 0, mods, implicits: implicits.length };
  });
}
