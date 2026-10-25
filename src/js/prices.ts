/* Precios aproximados de los únicos, a partir de lo que devuelve la API de poe.watch. Sin interfaz ni red: eso está en components/unique-table/price-source.ts. */

import { plainUniqueName } from "./unique-links";

/** Una fila de api.poe.watch/get: solo los campos que se leen. */
export interface WatchRow { name: string; mean: number; min: number; max: number; daily: number; divine: number; linkCount?: number; lowConfidence?: boolean }
/** Precio de un único: caos de media, mínimo y máximo, ventas al día, valor en divinos y si hay pocos datos. */
export interface Price { mean: number; min: number; max: number; daily: number; divine: number; low: boolean }
export type Prices = Record<string, Price>;

const toPrice = (r: WatchRow): Price => ({ mean: r.mean, min: r.min, max: r.max, daily: r.daily, divine: r.divine, low: !!r.lowConfidence });
const VARIANT = /^(.*) \(.+\)$/;

/**
 * Nombre → precio. Solo cuentan los objetos sin enlaces (los de 5 y 6 enlaces se venden más caros). Un único con variantes aparece
 * como "Nombre (variante)": también se guarda bajo "Nombre", con la variante más barata, por si la build no dice cuál lleva.
 */
export function reducePrices(rows: WatchRow[]): Prices {
  const prices: Prices = {}, exact = new Set<string>();
  for (const r of rows) {
    if (r.linkCount) continue;
    prices[r.name] = toPrice(r); exact.add(r.name);
    const base = VARIANT.exec(r.name)?.[1];
    if (base && !exact.has(base) && (!prices[base] || r.mean < prices[base].mean)) prices[base] = toPrice(r);
  }
  return prices;
}

/** El precio de un único por el nombre que le da PoB (los mutados, "Foulborn …", tienen el suyo) y, si no, por el limpio. */
export const priceOf = (prices: Prices, name: string): Price | null => prices[name] ?? prices[plainUniqueName(name)] ?? null;

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
