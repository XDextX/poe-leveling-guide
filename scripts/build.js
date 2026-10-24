// Genera la app: reduce los datos de data/ a gamedata/*.js y junta src/ en index.html.
// Uso: node scripts/build.js   (antes, si faltan los datos: node scripts/download-data.js)
const fs = require("fs"), path = require("path");
const { CLASSES, readJson } = require("./lib/common");
const { reduceGems, reduceSkills } = require("./lib/gems");
const { reduceQuests, reduceAreas, reduceStarts, readRoute } = require("./lib/campaign");
const { reduceTree } = require("./lib/tree");
const { bundle } = require("./lib/bundle");
const { writeGameData } = require("./lib/gamedata");

const root = path.join(__dirname, ".."), dataDir = path.join(root, "data");
const read = f => readJson(dataDir, f);

const G = reduceGems(read("gems.json"));
const data = {
  CLASSES, G, K: reduceSkills(read("repoe-gems.json"), G),
  Q: reduceQuests(read("quests.json")), A: reduceAreas(read("areas.json")), START: reduceStarts(read("characters.json")),
  ROUTE: readRoute(dataDir), T: reduceTree(read("tree.json")),
};
const date = fs.readFileSync(path.join(dataDir, "downloaded.txt"), "utf8").trim();
const dataFiles = writeGameData(root, data, date);
const html = bundle(path.join(root, "src"), { dataFiles, date, license: fs.readFileSync(path.join(dataDir, "exile-leveling-LICENSE"), "utf8") });
fs.writeFileSync(path.join(root, "index.html"), html);
const kb = f => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`${Object.keys(G).length} gemas, ${Object.keys(data.Q).length} misiones, ${Object.keys(data.A).length} zonas, ${Object.keys(data.T.nodes).length} nodos del árbol`);
console.log(["index.html", ...dataFiles].map(f => `  ${f}: ${kb(f)}`).join("\n"));
