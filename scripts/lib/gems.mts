// Gemas: nombre, atributo y nivel (exile-leveling) y etiquetas y tipos (RePoE).
import { shortGemId } from "./common.mts";

/** Lo que leemos de gems.json de exile-leveling. */
export interface SourceGem { id: string; name: string; primary_attribute?: string; required_level: number }
/** Lo que leemos de gems.min.json de RePoE. */
export interface RepoeGem {
  base_item?: { id: string; release_state: string };
  tags?: string[];
  active_skill?: { types?: string[]; weapon_restrictions?: string[] };
  support_gem?: { allowed_types?: string[]; excluded_types?: string[] };
}

/** Las "Royale" son del antiguo modo battle royale y repiten el nombre de la gema real. */
export function reduceGems(gems: Record<string, SourceGem>): Record<string, GemRow> {
  const G: Record<string, GemRow> = {};
  for (const g of Object.values(gems)) if (!g.id.includes("Royale")) G[shortGemId(g.id)] = [g.name, (g.primary_attribute || "-")[0], g.required_level];
  return G;
}

// Etiquetas que llevan casi todas las gemas y no distinguen nada al comparar.
const GENERIC_TAGS = new Set(["strength", "dexterity", "intelligence", "grants_active_skill", "support", "gem"]);

/**
 * Etiquetas y tipos de RePoE, solo de las gemas que conocemos. Los tipos admitidos de un soporte vienen en notación
 * polaca inversa (["Spell", "Totemable", "AND"]).
 */
export function reduceSkills(repoe: Record<string, RepoeGem>, G: Record<string, GemRow>): Record<string, SkillRow> {
  const K: Record<string, SkillRow> = {};
  for (const v of Object.values(repoe)) {
    const id = v.base_item && shortGemId(v.base_item.id);
    if (!id || !G[id] || v.base_item?.release_state !== "released" || K[id]) continue;
    K[id] = [(v.tags || []).filter(t => !GENERIC_TAGS.has(t)), v.active_skill?.types || [], v.active_skill?.weapon_restrictions || [],
      v.support_gem?.allowed_types || [], v.support_gem?.excluded_types || []];
  }
  return K;
}
