/* Descarga de precios y ligas de poe.watch (api.poe.watch), con una copia en el navegador para no repetir la descarga al recargar la página. */

import { reducePrices } from "../../js/prices";
import type { LeagueInfo, Prices, WatchRow } from "../../js/prices";

const API = "https://api.poe.watch";
// Una hora: recargar la página no vuelve a descargar nada. Quien quiera datos más frescos pulsa "Actualizar".
const TTL_MS = 60 * 60 * 1000;

/** Lo que se guarda, ya reducido (los precios son nombre → precio: unos pocos KB, no los cientos de la respuesta). */
interface Cached<T> { at: number; data: T }

const read = <T,>(key: string): Cached<T> | null => { try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; } };
const write = <T,>(key: string, value: Cached<T>): void => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

/**
 * Los precios de una categoría en una liga, de la copia si tiene menos de una hora (o siempre, si falla la red y hay copia);
 * `at` es cuándo se descargaron. `force` se salta la copia. Falla si la API no responde y no hay copia.
 */
export async function loadPrices(league: string, category: string, force = false): Promise<{ prices: Prices; at: number }> {
  const key = `poe-gemas:precios:${league}:${category}`, cached = read<Prices>(key);
  if (cached && !force && Date.now() - cached.at < TTL_MS) return { prices: cached.data, at: cached.at };
  try {
    const res = await fetch(`${API}/get?league=${encodeURIComponent(league)}&category=${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error(`poe.watch respondió ${res.status}`);
    const fresh = { at: Date.now(), data: reducePrices(await res.json() as WatchRow[]) };
    write(key, fresh);
    return { prices: fresh.data, at: fresh.at };
  } catch (e) {
    if (cached) return { prices: cached.data, at: cached.at };
    throw e;
  }
}

/** Las ligas que tiene poe.watch ahora, de la copia si tiene menos de una hora; vacío si no responde. */
export async function loadLeagues(): Promise<LeagueInfo[]> {
  const key = "poe-gemas:ligas", cached = read<LeagueInfo[]>(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  try {
    const res = await fetch(`${API}/leagues`);
    if (!res.ok) return cached?.data ?? [];
    const data = (await res.json() as { name: string; start_date: string }[]).map(l => ({ name: l.name, start: l.start_date }));
    write(key, { at: Date.now(), data });
    return data;
  } catch { return cached?.data ?? []; }
}
