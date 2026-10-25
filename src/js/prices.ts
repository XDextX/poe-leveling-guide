/* Precios aproximados de los únicos, a partir de lo que devuelve la API de poe.watch. Sin interfaz ni red: eso está en components/unique-table/price-source.ts. */

import { plainUniqueName } from "./unique-links";

/** Una fila de api.poe.watch/get: solo los campos que se leen. */
export interface WatchRow { name: string; mean: number; min: number; max: number; daily: number; divine: number; linkCount?: number; lowConfidence?: boolean }
/** Precio de un único: caos de media, mínimo y máximo, ventas al día, valor en divinos y si hay pocos datos. */
export interface Price { mean: number; min: number; max: number; daily: number; divine: number; low: boolean }
export type Prices = Record<string, Price>;

const toPrice = (r: WatchRow): Price => ({ mean: r.mean, min: r.min, max: r.max, daily: r.daily, divine: r.divine, low: !!r.lowConfidence });
const VARIANT = /^(.*) \((.+)\)$/;

/** Nombre exacto → precio. Solo cuentan los objetos sin enlaces (los de 5 y 6 enlaces se venden más caros); las variantes siguen como "Nombre (variante)". */
export function reducePrices(rows: WatchRow[]): Prices {
  const prices: Prices = {};
  for (const r of rows) if (!r.linkCount) prices[r.name] = toPrice(r);
  return prices;
}

/** Texto corto del precio: "≈ 30 c" (caos) o "≈ 2,5 div" cuando ya vale un divino o más; con pocos datos, un "?" detrás. */
export function formatPrice(p: Price): string {
  const round = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n)).toLocaleString("es");
  return `≈ ${p.divine >= 1 ? round(p.divine) + " div" : round(p.mean) + " c"}${p.low ? " ?" : ""}`;
}

/** Categorías de poe.watch que hay que pedir para estos huecos (las armas incluyen armadura: en la mano secundaria puede ir un escudo). */
export function categoriesOf(slots: string[]): string[] {
  const cats = new Set<string>();
  for (const s of slots) {
    if (["Helmet", "Body Armour", "Gloves", "Boots"].includes(s)) cats.add("armour");
    else if (s.startsWith("Weapon")) { cats.add("weapon"); cats.add("armour"); }
    else if (["Amulet", "Belt"].includes(s) || s.startsWith("Ring")) cats.add("accessory");
    else if (s.startsWith("Flask")) cats.add("flask");
    else if (s === "Jewel" || s.includes("Abyssal")) cats.add("jewel");
  }
  return [...cats];
}

/** Una liga de api.poe.watch/leagues: su nombre y cuándo empezó. */
export interface LeagueInfo { name: string; start: string }

// Las ligas que no son la de temporada normal: modo extremo (Hardcore, HC), Ruthless, Solo Self-Found y la permanente.
const NOT_SOFTCORE = /hardcore|^hc |ruthless|solo|standard/i;

/** La liga de temporada más reciente en softcore; Standard si no hay ninguna. */
export function currentLeague(leagues: LeagueInfo[]): string {
  const seasonal = leagues.filter(l => !NOT_SOFTCORE.test(l.name)).sort((a, b) => b.start.localeCompare(a.start));
  return seasonal[0]?.name ?? "Standard";
}

/** "hace menos de 1 min", "hace 12 min" o "hace 3 h", desde `at` hasta `now` (milisegundos). */
export function ago(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60000);
  return minutes < 1 ? "hace menos de 1 min" : minutes < 60 ? `hace ${minutes} min` : `hace ${Math.floor(minutes / 60)} h`;
}

// Palabras de una etiqueta de variante que no distinguen una de otra: la versión ("Pre 3.19.0", "Current"), artículos y tamaños comunes.
const NOISE = new Set(["current", "pre", "the", "and", "uber"]);
const tokens = (label: string): Set<string> => new Set((label.toLowerCase().match(/[a-z']{3,}/g) ?? []).filter(w => !NOISE.has(w)));

/** Cómo se llegó al precio: la variante coincidió, es el único precio, o no se supo cuál variante y se tomó la más barata. */
export type PriceHow = "variant" | "single" | "cheapest";
/** Un precio con cómo se eligió, y la etiqueta de la variante de poe.watch si se identificó. */
export interface PriceMatch { price: Price; how: PriceHow; label?: string; options: number }

/**
 * El precio de un único de la build, teniendo en cuenta su variante. poe.watch las separa como "Nombre (variante)", con etiquetas
 * propias ("Frenzy Charges") que no son las de PoB ("Frenzy Current"): se comparan por palabras y gana la variante que más comparte,
 * si hay una sola. Sin variante en la build, sin coincidencia o con empate, se usa el precio del nombre a secas si lo hay y, si no, la
 * variante más barata, y se avisa (how: "cheapest").
 */
export function priceFor(prices: Prices, item: { name: string; variants?: string[] }): PriceMatch | null {
  const names = [item.name, plainUniqueName(item.name)];
  const exact = names.map(n => prices[n]).find(Boolean);
  const variants = Object.entries(prices).flatMap(([key, price]) => {
    const m = VARIANT.exec(key);
    return m && names.includes(m[1]) ? [{ label: m[2] ?? "", price }] : [];
  });
  if (!variants.length) return exact ? { price: exact, how: "single", options: 1 } : null;
  const wanted = new Set((item.variants ?? []).flatMap(v => [...tokens(v)]));
  const scored = variants.map(v => ({ ...v, score: [...tokens(v.label)].filter(t => wanted.has(t)).length })).sort((a, b) => b.score - a.score);
  if (scored[0].score > 0 && scored[0].score > (scored[1]?.score ?? 0)) return { price: scored[0].price, how: "variant", label: scored[0].label, options: variants.length };
  if (exact) return { price: exact, how: "single", options: 1 };
  const cheapest = variants.reduce((best, v) => (v.price.mean < best.price.mean ? v : best));
  return { price: cheapest.price, how: "cheapest", options: variants.length };
}
