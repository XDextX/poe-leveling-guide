// Reduce los datos descargados en data/ a gamedata/, que va en el repositorio y es lo que usa el build.
// Uso: npm run gamedata   (antes, si faltan los datos: npm run data; después: npm run build)
import fs from "node:fs";
import path from "node:path";
import { CLASSES, readJson } from "./lib/common.mts";
import { reduceGems, reduceGemText, reduceSkills, type SourceGem, type RepoeGem, type RepoeBaseItem } from "./lib/gems.mts";
import { reduceQuests, reduceAreas, reduceStarts, readRoute, type SourceQuest, type SourceArea, type SourceCharacter } from "./lib/campaign.mts";
import { reduceTree, type SourceTree } from "./lib/tree.mts";
import { reduceUniques, type RepoeUnique } from "./lib/items.mts";
import { reduceTradeStats, type TradeStats } from "./lib/trade.mts";
import { writeGameData, writeGemText, writeTradeStats } from "./lib/gamedata.mts";

const root = path.join(import.meta.dirname, ".."), dataDir = path.join(root, "data");
const read = <T,>(f: string) => readJson<T>(dataDir, f);

const repoeGems = read<Record<string, RepoeGem>>("repoe-gems.json");
const G = reduceGems(read<Record<string, SourceGem>>("gems.json"), repoeGems, read<Record<string, RepoeBaseItem>>("repoe-base-items.json"));
const data: GameDataRaw = {
  CLASSES, G, K: reduceSkills(repoeGems, G),
  Q: reduceQuests(read<Record<string, SourceQuest>>("quests.json")), A: reduceAreas(read<Record<string, SourceArea>>("areas.json")),
  START: reduceStarts(read<Record<string, SourceCharacter>>("characters.json")),
  ROUTE: readRoute(dataDir), T: reduceTree(read<SourceTree>("tree.json")),
  U: reduceUniques(read<Record<string, RepoeUnique>>("repoe-uniques.json")),
};
const date = fs.readFileSync(path.join(dataDir, "downloaded.txt"), "utf8").trim();
const files = writeGameData(root, data, date, fs.readFileSync(path.join(dataDir, "exile-leveling-LICENSE"), "utf8"));
files.push(writeGemText(root, reduceGemText(repoeGems, G), date));
files.push(writeTradeStats(root, reduceTradeStats(read<TradeStats>("trade-stats.json")), date));
const kb = (f: string) => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`${Object.keys(G).length} gemas, ${Object.keys(data.Q).length} misiones, ${Object.keys(data.A).length} zonas, ${Object.keys(data.T.nodes).length} nodos del árbol, ${Object.keys(data.U).length} únicos`);
console.log(files.map(f => `  ${f}: ${kb(f)}`).join("\n"));
console.log("Listo. Ahora: npm run build");
