// Gemas: nombre, atributo y nivel (exile-leveling) y etiquetas y tipos (RePoE).
import { shortGemId } from "./common.mts";

/** Lo que leemos de gems.json de exile-leveling. */
export interface SourceGem { id: string; name: string; primary_attribute?: string; required_level: number }
/** Lo que leemos de gems.min.json de RePoE. */
export interface RepoeGem {
  /** Estadísticas fijas de la gema (ids como "base_chance_to_poison_on_hit_%") y su texto. */
  static?: { stat_text?: Record<string, string> };
  per_level?: Record<string, RepoeLevel>;
  base_item?: { id: string; release_state: string };
  tags?: string[];
  cast_time?: number;
  active_skill?: { types?: string[]; weapon_restrictions?: string[]; description?: string };
  support_gem?: { allowed_types?: string[]; excluded_types?: string[]; support_text?: string };
}
/** Lo que RePoE guarda de un nivel de gema. */
export interface RepoeLevel {
  costs?: Record<string, number>;
  stat_requirements?: { str?: number; dex?: number; int?: number };
  stat_text?: Record<string, string>;
}

/** Lo que leemos de base_items.min.json de RePoE: solo el arte del objeto. */
export interface RepoeBaseItem { visual_identity?: { dds_file: string } }

/** Ruta del arte de cada gema (sin "Art/" ni extensión), por el objeto base que RePoE da a cada una. */
function gemArt(repoe: Record<string, RepoeGem>, baseItems: Record<string, RepoeBaseItem>): Map<string, string> {
  const art = new Map<string, string>();
  for (const v of Object.values(repoe)) {
    const id = v.base_item && shortGemId(v.base_item.id), dds = v.base_item && baseItems[v.base_item.id]?.visual_identity?.dds_file;
    if (id && dds && !art.has(id)) art.set(id, dds.replace(/^Art\//, "").replace(/\.dds$/, ""));
  }
  return art;
}

/** Las "Royale" son del antiguo modo battle royale y repiten el nombre de la gema real. */
export function reduceGems(gems: Record<string, SourceGem>, repoe: Record<string, RepoeGem>, baseItems: Record<string, RepoeBaseItem>): Record<string, GemRow> {
  const G: Record<string, GemRow> = {}, art = gemArt(repoe, baseItems);
  for (const g of Object.values(gems)) {
    if (g.id.includes("Royale")) continue;
    const id = shortGemId(g.id);
    G[id] = [g.name, (g.primary_attribute || "-")[0], g.required_level, art.get(id) ?? ""];
  }
  return G;
}

// Etiquetas que llevan casi todas las gemas y no distinguen nada al comparar.
const GENERIC_TAGS = new Set(["strength", "dexterity", "intelligence", "grants_active_skill", "support", "gem"]);

/** Efectos que una gema provoca o potencia, según los ids de sus estadísticas: "poison", "ignite" o "bleed". RePoE no los da como etiqueta. */
function ailments(v: RepoeGem): string[] {
  const found = new Set<string>();
  // Los ids de estadística no llevan espacios ("chance_to_poison_on_hit"); las descripciones sí y se ignoran.
  const walk = (o: unknown): void => {
    if (typeof o === "string") { if (!o.includes(" ")) for (const a of ["poison", "ignit", "bleed"]) if (o.toLowerCase().includes(a)) found.add(a === "ignit" ? "ignite" : a); }
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") for (const [k, x] of Object.entries(o)) { walk(k); walk(x); }
  };
  walk(v.static); walk(v.per_level?.["1"]);
  return [...found];
}

/**
 * Etiquetas y tipos de RePoE, solo de las gemas que conocemos. Los tipos admitidos de un soporte vienen en notación
 * polaca inversa (["Spell", "Totemable", "AND"]).
 */
export function reduceSkills(repoe: Record<string, RepoeGem>, G: Record<string, GemRow>): Record<string, SkillRow> {
  const K: Record<string, SkillRow> = {};
  for (const v of Object.values(repoe)) {
    const id = v.base_item && shortGemId(v.base_item.id);
    if (!id || !G[id] || v.base_item?.release_state !== "released" || K[id]) continue;
    K[id] = [[...(v.tags || []).filter(t => !GENERIC_TAGS.has(t)), ...ailments(v)], v.active_skill?.types || [], v.active_skill?.weapon_restrictions || [],
      v.support_gem?.allowed_types || [], v.support_gem?.excluded_types || []];
  }
  return K;
}

/**
 * El texto de la ficha de cada gema (descripción, tiempo de lanzamiento, coste de maná, atributos que pide y líneas de efecto, todo a
 * nivel 1), por id. Va en un archivo aparte que la página carga solo al pasar el ratón por una gema, porque pesa bastante.
 */
export function reduceGemText(repoe: Record<string, RepoeGem>, G: Record<string, GemRow>): Record<string, GemTextRow> {
  const T: Record<string, GemTextRow> = {};
  for (const v of Object.values(repoe)) {
    const id = v.base_item && shortGemId(v.base_item.id);
    if (!id || !G[id] || v.base_item?.release_state !== "released" || T[id]) continue;
    const lvl = v.per_level?.["1"], req = lvl?.stat_requirements ?? {};
    const lines = [...new Set([...Object.values(v.static?.stat_text ?? {}), ...Object.values(lvl?.stat_text ?? {})])];
    T[id] = [v.active_skill?.description ?? v.support_gem?.support_text ?? "", (v.cast_time ?? 0) / 1000, lvl?.costs?.Mana ?? 0, req.str ?? 0, req.dex ?? 0, req.int ?? 0, lines];
  }
  return T;
}
