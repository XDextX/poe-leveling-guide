// Genera index.html: reduce los datos de data/ a lo que necesita la guía y los inyecta en src/template.html.
// Uso: node scripts/build.js   (antes, si faltan los datos: node scripts/download-data.js)
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = path.join(__dirname, ".."), dataDir = path.join(root, "data");
const read = f => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
const quests = read("quests.json"), gems = read("gems.json"), chars = read("characters.json"), areas = read("areas.json"), tree = read("tree.json");

const CLASSES = ["Marauder", "Duelist", "Ranger", "Shadow", "Witch", "Templar", "Scion"];
const mask = classes => classes.length ? classes.reduce((m, c) => m | 1 << CLASSES.indexOf(c), 0) : 127;
const short = id => id.replace("Metadata/Items/Gems/", "");

// Gema: [nombre, atributo (s/d/i/-), nivel requerido]. Las "Royale" son del antiguo modo battle royale y repiten nombre.
const G = {};
for (const g of Object.values(gems)) if (!g.id.includes("Royale")) G[short(g.id)] = [g.name, (g.primary_attribute || "-")[0], g.required_level];

// Misión: { n: nombre, o: { oferta: [npc, {gema: máscara de clases}, {gema: [máscara, vendedor]}] } }
const Q = {};
for (const q of Object.values(quests)) {
  const o = {};
  for (const [oid, of] of Object.entries(q.reward_offers))
    o[oid] = [of.quest_npc || "",
      Object.fromEntries(Object.entries(of.quest || {}).map(([id, v]) => [short(id), mask(v.classes)])),
      Object.fromEntries(Object.entries(of.vendor || {}).map(([id, v]) => [short(id), [mask(v.classes), v.npc]]))];
  Q[q.id] = { n: q.name, o };
}

// Zona: [nombre, acto, nivel, ciudad (1/0), ciudad del acto, recetas de crafteo]
const A = {};
for (const a of Object.values(areas)) A[a.id] = [a.map_name || a.name, a.act, a.level, a.is_town_area ? 1 : 0, a.parent_town_area_id, a.crafting_recipes];

// Árbol de pasivas oficial. Nodo: [x, y, tipo, nombre, stats, ascendencia]
// tipo: 0 pequeño, 1 notable, 2 keystone, 3 maestría, 4 hueco de joya, 5 inicio de clase.
// Las órbitas de 16 y 40 nodos no son equidistantes; estos ángulos son los mismos que usa Path of Building.
const ANGLES = { 16: [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330],
  40: [0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 140, 150, 160, 170, 180, 190, 200, 210, 220, 225, 230, 240, 250, 260, 270, 280, 290, 300, 310, 315, 320, 330, 340, 350] };
const { skillsPerOrbit, orbitRadii } = tree.constants;
const T = { nodes: {}, edges: [], masteries: {} };
for (const [id, n] of Object.entries(tree.nodes)) {
  const g = tree.groups[n.group];
  if (!g || n.isProxy || n.expansionJewel && !n.isJewelSocket) continue;
  const count = skillsPerOrbit[n.orbit], r = orbitRadii[n.orbit];
  const deg = ANGLES[count] ? ANGLES[count][n.orbitIndex] : 360 * n.orbitIndex / count;
  const a = deg * Math.PI / 180;
  const type = n.isKeystone ? 2 : n.isMastery ? 3 : n.isJewelSocket ? 4 : n.classStartIndex !== undefined ? 5 : n.isNotable ? 1 : 0;
  T.nodes[id] = [Math.round(g.x + r * Math.sin(a)), Math.round(g.y - r * Math.cos(a)), type, n.name || "", (n.stats || []).join("\n"), n.ascendancyName || ""];
  if (n.masteryEffects) T.masteries[id] = Object.fromEntries(n.masteryEffects.map(e => [e.effect, e.stats.join("\n")]));
}
for (const [id, n] of Object.entries(tree.nodes))
  for (const o of n.out || []) {
    const a = T.nodes[id], b = T.nodes[o];
    // Ni aristas hacia maestrías ni entre la ascendencia y el árbol principal: no son caminos reales.
    if (a && b && a[2] !== 3 && b[2] !== 3 && a[5] === b[5] && a[2] !== 5 && b[2] !== 5) T.edges.push(+id, +o);
  }

const ROUTE = Array.from({ length: 10 }, (_, i) => fs.readFileSync(path.join(dataDir, "routes", `act-${i + 1}.txt`), "utf8")).join("\n");
const START = Object.fromEntries(Object.entries(chars).map(([c, v]) => [c, [short(v.start_gem_id), short(v.chest_gem_id)]]));

// Build de ejemplo en el formato de exportación de PoB (XML comprimido con zlib, base64 url-safe).
const exampleGems = ["Fireball", "Arcane Surge", "Spell Echo", "Elemental Focus", "Controlled Destruction", "Flame Dash",
  "Flammability", "Herald of Ash", "Vaal Fireball", "Ice Nova of Frostbolts", "Awakened Spell Echo", "Empower"];
const xml = `<?xml version="1.0" encoding="UTF-8"?><PathOfBuilding><Build level="90" className="Witch" ascendClassName="Elementalist" bandit="None"/>` +
  `<Skills><SkillSet id="1"><Skill enabled="true">${exampleGems.map(n => `<Gem nameSpec="${n}" level="20" quality="0" enabled="true"/>`).join("")}</Skill></SkillSet></Skills></PathOfBuilding>`;
const example = zlib.deflateSync(xml).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

const data = JSON.stringify({ CLASSES, G, Q, A, ROUTE, START, T });
const license = fs.readFileSync(path.join(dataDir, "exile-leveling-LICENSE"), "utf8").replace(/[<&]/g, c => c === "<" ? "&lt;" : "&amp;");
const date = fs.readFileSync(path.join(dataDir, "downloaded.txt"), "utf8").trim();
const html = fs.readFileSync(path.join(root, "src", "template.html"), "utf8").replace("__DATA__", () => data).replaceAll("__DATE__", date)
  .replace("__EXAMPLE__", example).replace("__LICENSE__", () => license);
fs.writeFileSync(path.join(root, "index.html"), html);
console.log(`index.html: ${Object.keys(G).length} gemas, ${Object.keys(Q).length} misiones, ${Object.keys(A).length} zonas, ${Object.keys(T.nodes).length} nodos del árbol, ${(html.length / 1024).toFixed(0)} KB`);
