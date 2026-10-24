/* El equipo de la build: los objetos equipados y las joyas del árbol, con sus mods tal como se ven en el juego. */

import { treeSpecs } from "./tree";

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
export function parseItems(doc: Document): Item[] {
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
