// Descarga a data/ los datos que usa scripts/build.js. Una petición por archivo, con 1 s de pausa, y se para ante el primer error.
// Uso: node scripts/download-data.js
const fs = require("fs"), path = require("path");
const dataDir = path.join(__dirname, "..", "data");
const LEVELING = "https://raw.githubusercontent.com/HeartofPhos/exile-leveling/main";
const FILES = [
  ...["quests", "gems", "characters", "areas"].map(f => [`${LEVELING}/common/data/json/${f}.json`, `${f}.json`]),
  ...Array.from({ length: 10 }, (_, i) => [`${LEVELING}/common/data/routes/act-${i + 1}.txt`, `routes/act-${i + 1}.txt`]),
  [`${LEVELING}/LICENSE`, "exile-leveling-LICENSE"],
  ["https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json", "tree.json"],
  ["https://repoe-fork.github.io/gems.min.json", "repoe-gems.json"],
];

(async () => {
  fs.mkdirSync(path.join(dataDir, "routes"), { recursive: true });
  for (const [i, [url, file]] of FILES.entries()) {
    if (i) await new Promise(r => setTimeout(r, 1000));
    const res = await fetch(url, { headers: { "User-Agent": "poe-leveling-guide" } });
    if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
    fs.writeFileSync(path.join(dataDir, file), await res.text());
    console.log(`(${i + 1}/${FILES.length}) ${file}`);
  }
  fs.writeFileSync(path.join(dataDir, "downloaded.txt"), new Date().toISOString().slice(0, 10) + "\n");
  console.log("Listo. Ahora: node scripts/build.js");
})().catch(e => { console.error("Error: " + e.message); process.exitCode = 1; });
