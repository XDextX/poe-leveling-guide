/* El equipo de la build: los objetos equipados y las joyas del árbol, con sus mods tal como se ven en el juego. */

import { parseItemText } from "./item-text";
import { treeSpecs } from "./tree";

/** Objetos equipados (conjunto activo) y joyas del árbol activo, cada uno leído con parseItemText. */
export function parseItems(doc: Document): Item[] {
  const text = new Map([...doc.querySelectorAll("Items > Item")].map(el => [el.getAttribute("id") ?? "", el.textContent ?? ""]));
  const itemsEl = doc.querySelector("Items");
  const set = doc.querySelector(`ItemSet[id="${itemsEl?.getAttribute("activeItemSet")}"]`) || doc.querySelector("ItemSet") || itemsEl;
  const used: [slot: string, id: string][] = [];
  const take = (slot: string | null, id: string | null) => { if (slot && id && id !== "0") used.push([slot, id]); };
  set?.querySelectorAll(":scope > Slot").forEach(s => take(s.getAttribute("name"), s.getAttribute("itemId")));
  treeSpecs(doc).active?.querySelectorAll("Socket").forEach(s => take("Jewel", s.getAttribute("itemId")));
  return used.filter(([, id]) => text.has(id)).map(([slot, id]) => parseItemText(slot, text.get(id) ?? ""));
}
