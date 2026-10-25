/*
 * El texto de un objeto de Path of Building ("Rarity: UNIQUE", el nombre, la base, "Implicits: 1", los mods…) como un Item.
 * Es texto puro, sin XML ni DOM, así que se prueba directamente (tests/pob-item-text.test.ts).
 */

/**
 * Qué variantes eligió el autor en un único con varias versiones, leído de las líneas de cabecera del objeto. PoB tiene dos
 * sistemas (Item.lua, ItemClass:CheckModLineVariant):
 * - Variantes: "Selected Variant: N" y hasta cinco alternativas ("Has Alt Variant: true" + "Selected Alt Variant: M", y las
 *   de "Two" a "Five"). Un mod con {variant:1,2} vale si su lista incluye la elegida o cualquiera de las alternativas.
 * - Grupos y versiones: "Selected Version: N" y "Selected Variant Group: G=V". Un mod con {group:G} vale si su variante
 *   coincide con la elegida para ese grupo, y uno con {version:N} solo si N es la versión elegida.
 */
interface Selection {
  /** Variante elegida y alternativas activas; vacío si el objeto no declara variantes (entonces no se descarta nada). */
  variants: number[];
  usesGroups: boolean;
  version?: number;
  /** Variante elegida de cada grupo. */
  groups: Map<number, number>;
}

const ALT_NAMES = ["Alt Variant", "Alt Variant Two", "Alt Variant Three", "Alt Variant Four", "Alt Variant Five"];

/** Lee de las líneas de cabecera qué variantes, versión y grupos están elegidos. */
function readSelection(L: string[]): Selection {
  const header = (name: string): number | undefined => { for (const l of L) { const m = new RegExp(`^${name}: (\\d+)`).exec(l); if (m) return +m[1]; } };
  // Si el autor no eligió, PoB usa la última variante de la lista ("Variant: …" una por línea).
  const last = L.filter(l => l.startsWith("Variant: ")).length || undefined;
  const alts = ALT_NAMES.filter(name => L.some(l => l.startsWith(`Has ${name}:`))).map(name => header(`Selected ${name}`) ?? last);
  const groups = new Map<number, number>();
  for (const l of L) { const m = /^Selected Variant Group: (\d+)\s*=\s*(\d+)$/.exec(l); if (m) groups.set(+m[1], +m[2]); }
  return {
    variants: [header("Selected Variant") ?? last, ...alts].filter((v): v is number => v !== undefined),
    // También lo es un objeto cuyas líneas llevan {group:} o {version:}, aunque no diga qué eligió.
    usesGroups: groups.size > 0 || L.some(l => /^Selected Version: /.test(l) || /\{(?:group|version):/.test(l)),
    version: header("Selected Version"), groups,
  };
}

/** Las listas de variantes, versiones y grupos con que está etiquetada una línea de mod; una etiqueta ausente es undefined. */
function readTags(line: string): { variants?: Set<number>; versions?: Set<number>; groups?: Set<number> } {
  const tags: ReturnType<typeof readTags> = {};
  for (const [, kind, value] of line.matchAll(/\{(variant|version|group):([^}]*)\}/g)) {
    const ids = new Set([...value.matchAll(/\d+/g)].map(m => +m[0]));
    if (kind === "variant") tags.variants = ids;
    else if (kind === "version") tags.versions = ids;
    else tags.groups = new Set([...ids].filter(g => g > 0));
  }
  return tags;
}

/** Si el mod vale con lo que eligió el autor (o es de otra variante, versión o grupo y no se ve). */
function keepsLine(line: string, sel: Selection): boolean {
  const { variants, versions, groups } = readTags(line);
  if (sel.usesGroups) {
    if (versions && (sel.version === undefined || !versions.has(sel.version))) return false;
    if (groups) {
      if (!variants) return false;
      return [...groups].some(g => { const chosen = sel.groups.get(g); return chosen !== undefined && variants.has(chosen); });
    }
    return !variants;
  }
  return !variants || !sel.variants.length || sel.variants.some(v => variants.has(v));
}

/**
 * Mod de PoB tal como se ve en el juego, o null si es de otra variante del único.
 * PoB guarda todas las variantes ({variant:1,2}) y los rangos con la tirada aparte ({range:0.3}(10-20)%).
 */
function modText(line: string, sel: Selection): string | null {
  if (!keepsLine(line, sel)) return null;
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
  const sel = readSelection(L);
  const clean = (lines: string[]) => lines.map(l => modText(l, sel)).filter((t): t is string => !!t);
  // "Implicits: N" dice cuántas de las líneas siguientes son implícitos; el resto, hasta el final, son los mods.
  const imp = L.findIndex(l => /^Implicits:/.test(l)), count = imp < 0 ? 0 : +(/^Implicits:\s*(\d+)/.exec(L[imp])?.[1] ?? 0);
  const implicits = imp < 0 ? [] : clean(L.slice(imp + 1, imp + 1 + count));
  const mods = imp < 0 ? [] : [...implicits, ...clean(L.slice(imp + 1 + count))];
  // Las líneas "Variant: etiqueta" van por orden: la variante N es la N-ésima.
  const labels = L.filter(l => l.startsWith("Variant: ")).map(l => l.slice(9).trim());
  const variants = [...new Set(sel.variants.map(n => labels[n - 1]).filter(Boolean))];
  // Los mods que solo tienen algunas variantes (no todas) y entre ellas la elegida: lo que distingue esta variante de las demás, primero los más exclusivos.
  const exclusive = (l: string) => readTags(l).variants?.size ?? Infinity;
  const distinct = imp < 0 ? [] : clean(L.slice(imp + 1).filter(l => { const v = readTags(l).variants; return !!v && v.size < labels.length && sel.variants.some(n => v.has(n)); }).sort((a, b) => exclusive(a) - exclusive(b)));
  return { slot, rarity, name: L[1] || "", base: named ? L[2] || "" : L[1] || "", req: +(raw.match(/LevelReq: (\d+)/) || [])[1] || 0, mods, implicits: implicits.length, variants, distinct };
}
