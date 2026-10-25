/* La liga que el usuario eligió para los precios y el comercio, recordada en este navegador. */

export const DEFAULT_LEAGUE = "Standard";
const KEY = "poe-gemas:liga";

/** La liga que el usuario eligió, o null si nunca eligió una. */
export const savedLeague = (): string | null => { try { return localStorage.getItem(KEY)?.trim() || null; } catch { return null; } };

/** Recuerda la liga elegida; si el navegador no deja guardar, la guía funciona igual. */
export function saveLeague(league: string): void { try { localStorage.setItem(KEY, league); } catch {} }
