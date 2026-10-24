// Campaña (exile-leveling): misiones con sus recompensas y vendedores, zonas, gemas iniciales y el texto de la ruta.
import fs from "node:fs";
import path from "node:path";
import { classMask, shortGemId } from "./common.mts";

/** Lo que leemos de quests.json, areas.json y characters.json de exile-leveling. */
export interface SourceOffer { quest_npc?: string; quest?: Record<string, { classes: string[] }>; vendor?: Record<string, { classes: string[]; npc: string }> }
export interface SourceQuest { id: string; name: string; reward_offers: Record<string, SourceOffer> }
export interface SourceArea { id: string; name: string; map_name?: string; act: number; level: number; is_town_area: boolean; parent_town_area_id: string | null; crafting_recipes: string[] }
export interface SourceCharacter { start_gem_id: string; chest_gem_id: string }

export function reduceQuests(quests: Record<string, SourceQuest>): Record<string, QuestRaw> {
  const Q: Record<string, QuestRaw> = {};
  for (const q of Object.values(quests)) {
    const o: Record<string, OfferRow> = {};
    for (const [oid, of] of Object.entries(q.reward_offers))
      o[oid] = [of.quest_npc || "",
        Object.fromEntries(Object.entries(of.quest || {}).map(([id, v]) => [shortGemId(id), classMask(v.classes)])),
        Object.fromEntries(Object.entries(of.vendor || {}).map(([id, v]): [string, [ClassMask, string]] => [shortGemId(id), [classMask(v.classes), v.npc]]))];
    Q[q.id] = { n: q.name, o };
  }
  return Q;
}

export const reduceAreas = (areas: Record<string, SourceArea>): Record<string, AreaRow> => Object.fromEntries(Object.values(areas).map((a): [string, AreaRow] =>
  [a.id, [a.map_name || a.name, a.act, a.level, a.is_town_area ? 1 : 0, a.parent_town_area_id, a.crafting_recipes]]));

/** Clase → [gema inicial, gema del primer cofre] */
export const reduceStarts = (chars: Record<string, SourceCharacter>): Record<string, [string, string]> =>
  Object.fromEntries(Object.entries(chars).map(([c, v]): [string, [string, string]] => [c, [shortGemId(v.start_gem_id), shortGemId(v.chest_gem_id)]]));

/** Los diez actos de la ruta en un solo texto. */
export const readRoute = (dataDir: string): string =>
  Array.from({ length: 10 }, (_, i) => fs.readFileSync(path.join(dataDir, "routes", `act-${i + 1}.txt`), "utf8")).join("\n");
