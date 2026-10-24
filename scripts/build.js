// Genera index.html: reduce los datos de data/ a lo que necesita la guía y los junta con src/ en un solo archivo.
// Uso: node scripts/build.js   (antes, si faltan los datos: node scripts/download-data.js)
const fs = require("fs"), path = require("path");
const { CLASSES, readJson } = require("./lib/common");
const { reduceGems, reduceSkills } = require("./lib/gems");
const { reduceQuests, reduceAreas, reduceStarts, readRoute } = require("./lib/campaign");
const { reduceTree } = require("./lib/tree");
const { bundle } = require("./lib/bundle");

const root = path.join(__dirname, ".."), dataDir = path.join(root, "data");
const read = f => readJson(dataDir, f);

const G = reduceGems(read("gems.json"));
const data = {
  CLASSES, G, K: reduceSkills(read("repoe-gems.json"), G),
  Q: reduceQuests(read("quests.json")), A: reduceAreas(read("areas.json")), START: reduceStarts(read("characters.json")),
  ROUTE: readRoute(dataDir), T: reduceTree(read("tree.json")),
};
const html = bundle(path.join(root, "src"), {
  data,
  date: fs.readFileSync(path.join(dataDir, "downloaded.txt"), "utf8").trim(),
  license: fs.readFileSync(path.join(dataDir, "exile-leveling-LICENSE"), "utf8"),
});
fs.writeFileSync(path.join(root, "index.html"), html);
console.log(`index.html: ${Object.keys(G).length} gemas, ${Object.keys(data.Q).length} misiones, ${Object.keys(data.A).length} zonas, ${Object.keys(data.T.nodes).length} nodos del árbol, ${(html.length / 1024).toFixed(0)} KB`);
