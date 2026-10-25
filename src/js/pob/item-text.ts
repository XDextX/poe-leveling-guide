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
  /** Las etiquetas de las líneas "Variant: …", por orden: la variante N es la N-ésima. */
  labels: string[];
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
  const has = (name: string) => L.some(l => l.startsWith(name + ": "));
  /** El número de la primera cabecera "Nombre: N", o undefined si no está o no es un número. */
  const header = (name: string): number | undefined => {
    const line = L.find(l => l.startsWith(name + ": "));
    const n = parseInt(line?.slice(name.length + 2) ?? "", 10);
    return Number.isNaN(n) ? undefined : n;
  };
  const labels = L.filter(l => l.startsWith("Variant: ")).map(l => l.slice(9).trim());
  // Si el autor no eligió, PoB usa la última variante de la lista ("Variant: …" una por línea).
  const last = labels.length || undefined;
  const alts = ALT_NAMES.filter(name => has(`Has ${name}`)).map(name => header(`Selected ${name}`) ?? last);
  const groups = new Map<number, number>();
  for (const l of L) { const m = /^Selected Variant Group: (\d+)\s*=\s*(\d+)$/.exec(l); if (m) groups.set(+m[1], +m[2]); }
  return {
    labels,
    variants: [header("Selected Variant") ?? last, ...alts].filter((v): v is number => v !== undefined),
    // También lo es un objeto cuyas líneas llevan {group:} o {version:}, aunque no diga qué eligió.
    usesGroups: groups.size > 0 || has("Selected Version") || L.some(l => /\{(?:group|version):/.test(l)),
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

/** Las líneas de mod de un objeto: las implícitas ("Implicits: N" dice cuántas de las siguientes lo son) y el resto, hasta el final. */
function modLines(L: string[]): { implicit: string[]; rest: string[] } {
  const i = L.findIndex(l => /^Implicits:/.test(l));
  if (i < 0) return { implicit: [], rest: [] };
  const count = +(/^Implicits:\s*(\d+)/.exec(L[i])?.[1] ?? 0), lines = L.slice(i + 1);
  return { implicit: lines.slice(0, count), rest: lines.slice(count) };
}

/**
 * Las líneas que solo valen para algunas variantes (no todas) y entre ellas la elegida: lo que distingue esta variante de las
 * demás. Primero las más exclusivas (las de menos variantes), que son las que mejor la distinguen.
 */
function distinctLines(lines: string[], sel: Selection): string[] {
  const variantsOf = (l: string) => readTags(l).variants;
  return lines
    .filter(l => { const v = variantsOf(l); return !!v && v.size < sel.labels.length && sel.variants.some(n => v.has(n)); })
    .sort((a, b) => variantsOf(a)!.size - variantsOf(b)!.size);
}

/** Texto de un objeto de PoB y el hueco en que va → un Item: sus mods (los primeros `implicits` son los implícitos), la variante elegida y los mods que la distinguen. */
export function parseItemText(slot: string, raw: string): Item {
  const L = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const rarity = (L[0] || "").replace("Rarity: ", "");
  const named = rarity === "RARE" || rarity === "UNIQUE";
  const sel = readSelection(L);
  const clean = (lines: string[]) => lines.map(l => modText(l, sel)).filter((t): t is string => !!t);
  const { implicit, rest } = modLines(L);
  const implicits = clean(implicit);
  return {
    slot, rarity, name: L[1] || "", base: named ? L[2] || "" : L[1] || "", req: +(raw.match(/LevelReq: (\d+)/) || [])[1] || 0,
    mods: [...implicits, ...clean(rest)], implicits: implicits.length,
    variants: [...new Set(sel.variants.map(n => sel.labels[n - 1]).filter(Boolean))],
    distinct: clean(distinctLines([...implicit, ...rest], sel)),
  };
}
