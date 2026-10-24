/*
 * El texto de un objeto de Path of Building ("Rarity: UNIQUE", el nombre, la base, "Implicits: 1", los mods…) como un Item.
 * Es texto puro, sin XML ni DOM, así que se prueba directamente (tests/pob-item-text.test.ts).
 */

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

/** Texto de un objeto de PoB y el hueco en que va → { slot, rarity, name, base, req, mods, implicits }; los primeros `implicits` mods son los implícitos. */
export function parseItemText(slot: string, raw: string): Item {
  const L = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const rarity = (L[0] || "").replace("Rarity: ", "");
  const named = rarity === "RARE" || rarity === "UNIQUE";
  const variant = (raw.match(/Selected Variant: (\d+)/) || [])[1] ?? "";
  const clean = (lines: string[]) => lines.map(l => modText(l, variant)).filter((t): t is string => !!t);
  // "Implicits: N" dice cuántas de las líneas siguientes son implícitos; el resto, hasta el final, son los mods.
  const imp = L.findIndex(l => /^Implicits:/.test(l)), count = imp < 0 ? 0 : +(/^Implicits:\s*(\d+)/.exec(L[imp])?.[1] ?? 0);
  const implicits = imp < 0 ? [] : clean(L.slice(imp + 1, imp + 1 + count));
  const mods = imp < 0 ? [] : [...implicits, ...clean(L.slice(imp + 1 + count))];
  return { slot, rarity, name: L[1] || "", base: named ? L[2] || "" : L[1] || "", req: +(raw.match(/LevelReq: (\d+)/) || [])[1] || 0, mods, implicits: implicits.length };
}
