// Campaña (exile-leveling): misiones con sus recompensas y vendedores, zonas, gemas iniciales y el texto de la ruta.
const fs = require("fs"), path = require("path");
const { classMask, shortGemId } = require("./common");

/** Misión: { n: nombre, o: { oferta: [npc, {gema: máscara de clases}, {gema: [máscara, vendedor]}] } } */
function reduceQuests(quests) {
  const Q = {};
  for (const q of Object.values(quests)) {
    const o = {};
    for (const [oid, of] of Object.entries(q.reward_offers))
      o[oid] = [of.quest_npc || "",
        Object.fromEntries(Object.entries(of.quest || {}).map(([id, v]) => [shortGemId(id), classMask(v.classes)])),
        Object.fromEntries(Object.entries(of.vendor || {}).map(([id, v]) => [shortGemId(id), [classMask(v.classes), v.npc]]))];
    Q[q.id] = { n: q.name, o };
  }
  return Q;
}

/** Zona: [nombre, acto, nivel, ciudad (1/0), ciudad del acto, recetas de crafteo] */
const reduceAreas = areas => Object.fromEntries(Object.values(areas).map(a =>
  [a.id, [a.map_name || a.name, a.act, a.level, a.is_town_area ? 1 : 0, a.parent_town_area_id, a.crafting_recipes]]));

/** Clase → [gema inicial, gema del primer cofre] */
const reduceStarts = chars => Object.fromEntries(Object.entries(chars).map(([c, v]) => [c, [shortGemId(v.start_gem_id), shortGemId(v.chest_gem_id)]]));

/** Los diez actos de la ruta en un solo texto. */
const readRoute = dataDir => Array.from({ length: 10 }, (_, i) => fs.readFileSync(path.join(dataDir, "routes", `act-${i + 1}.txt`), "utf8")).join("\n");

module.exports = { reduceQuests, reduceAreas, reduceStarts, readRoute };
