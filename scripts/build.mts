// Genera la app: reduce los datos de data/ a gamedata/*.js y junta src/ en index.html.
// Uso: npm run build   (antes, si faltan los datos: npm run data)
import fs from "node:fs";
import path from "node:path";
import { CLASSES, readJson } from "./lib/common.mts";
import { reduceGems, reduceSkills, type SourceGem, type RepoeGem } from "./lib/gems.mts";
import { reduceQuests, reduceAreas, reduceStarts, readRoute, type SourceQuest, type SourceArea, type SourceCharacter } from "./lib/campaign.mts";
import { reduceTree, type SourceTree } from "./lib/tree.mts";
import { bundle } from "./lib/bundle.mts";
import { writeGameData } from "./lib/gamedata.mts";
import { sitemap } from "./lib/site.mts";

const root = path.join(import.meta.dirname, ".."), dataDir = path.join(root, "data");
const read = <T,>(f: string) => readJson<T>(dataDir, f);

const G = reduceGems(read<Record<string, SourceGem>>("gems.json"));
const data: GameDataRaw = {
  CLASSES, G, K: reduceSkills(read<Record<string, RepoeGem>>("repoe-gems.json"), G),
  Q: reduceQuests(read<Record<string, SourceQuest>>("quests.json")), A: reduceAreas(read<Record<string, SourceArea>>("areas.json")),
  START: reduceStarts(read<Record<string, SourceCharacter>>("characters.json")),
  ROUTE: readRoute(dataDir), T: reduceTree(read<SourceTree>("tree.json")),
};
const date = fs.readFileSync(path.join(dataDir, "downloaded.txt"), "utf8").trim();
const dataFiles = writeGameData(root, data, date);
const html = bundle(path.join(root, "src"), { dataFiles, date, license: fs.readFileSync(path.join(dataDir, "exile-leveling-LICENSE"), "utf8") });
fs.writeFileSync(path.join(root, "index.html"), html);
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap(date));
const kb = (f: string) => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`${Object.keys(G).length} gemas, ${Object.keys(data.Q).length} misiones, ${Object.keys(data.A).length} zonas, ${Object.keys(data.T.nodes).length} nodos del árbol`);
console.log(["index.html", ...dataFiles].map(f => `  ${f}: ${kb(f)}`).join("\n"));
