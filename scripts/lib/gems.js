// Gemas: nombre, atributo y nivel (exile-leveling) y etiquetas y tipos (RePoE).
const { shortGemId } = require("./common");

/** Gema: [nombre, atributo (s/d/i/-), nivel requerido]. Las "Royale" son del antiguo modo battle royale y repiten nombre. */
function reduceGems(gems) {
  const G = {};
  for (const g of Object.values(gems)) if (!g.id.includes("Royale")) G[shortGemId(g.id)] = [g.name, (g.primary_attribute || "-")[0], g.required_level];
  return G;
}

// Etiquetas que llevan casi todas las gemas y no distinguen nada al comparar.
const GENERIC_TAGS = new Set(["strength", "dexterity", "intelligence", "grants_active_skill", "support", "gem"]);

/**
 * Etiquetas y tipos de RePoE, solo de las gemas que conocemos: [etiquetas, tipos, armas, soporte: tipos admitidos, soporte: excluidos].
 * Los tipos admitidos de un soporte vienen en notación polaca inversa (["Spell", "Totemable", "AND"]).
 */
function reduceSkills(repoe, G) {
  const K = {};
  for (const v of Object.values(repoe)) {
    const id = v.base_item && shortGemId(v.base_item.id);
    if (!id || !G[id] || v.base_item.release_state !== "released" || K[id]) continue;
    K[id] = [(v.tags || []).filter(t => !GENERIC_TAGS.has(t)), v.active_skill?.types || [], v.active_skill?.weapon_restrictions || [],
      v.support_gem?.allowed_types || [], v.support_gem?.excluded_types || []];
  }
  return K;
}

module.exports = { reduceGems, reduceSkills };
