// Mods del comercio oficial (api/trade/data/stats) reducidos a "texto del mod con # en vez de números" → identificador.
import { normalizeMod } from "../../src/js/trade.ts";

/** Lo que leemos de api/trade/data/stats: grupos de mods con su texto y su identificador. */
export interface TradeStats { result: { label: string; entries: { id: string; text: string }[] }[] }

// Los únicos llevan mods explícitos e implícitos; el resto de grupos (encantamientos, fracturados, pseudo…) no hacen falta.
const GROUPS = ["Explicit", "Implicit"];

/** Texto normalizado → identificador (explicit.stat_…). Si dos mods comparten texto, gana el primero. */
export function reduceTradeStats(src: TradeStats): Record<string, string> {
  const table: Record<string, string> = {};
  for (const group of src.result.filter(g => GROUPS.includes(g.label))) for (const e of group.entries) table[normalizeMod(e.text)] ??= e.id;
  return table;
}
