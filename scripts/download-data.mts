// Descarga a data/ los datos que reduce scripts/gamedata.mts. Una petición por archivo, con 1 s de pausa, y se para ante el primer error.
// Uso: npm run data
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(import.meta.dirname, "..", "data");
const LEVELING = "https://raw.githubusercontent.com/HeartofPhos/exile-leveling/main";
const FILES: [url: string, file: string][] = [
  ...["quests", "gems", "characters", "areas"].map((f): [string, string] => [`${LEVELING}/common/data/json/${f}.json`, `${f}.json`]),
  ...Array.from({ length: 10 }, (_, i): [string, string] => [`${LEVELING}/common/data/routes/act-${i + 1}.txt`, `routes/act-${i + 1}.txt`]),
  [`${LEVELING}/LICENSE`, "exile-leveling-LICENSE"],
  ["https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json", "tree.json"],
  ["https://repoe-fork.github.io/gems.min.json", "repoe-gems.json"],
  ["https://repoe-fork.github.io/uniques.min.json", "repoe-uniques.json"],
  ["https://repoe-fork.github.io/base_items.min.json", "repoe-base-items.json"],
  ["https://www.pathofexile.com/api/trade/data/stats", "trade-stats.json"],
];

try {
  fs.mkdirSync(path.join(dataDir, "routes"), { recursive: true });
  for (const [i, [url, file]] of FILES.entries()) {
    if (i) await new Promise(r => setTimeout(r, 1000));
    const res = await fetch(url, { headers: { "User-Agent": "poe-leveling-guide (https://github.com/XDextX/poe-leveling-guide)", Accept: "application/json" } });
    if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
    fs.writeFileSync(path.join(dataDir, file), await res.text());
    console.log(`(${i + 1}/${FILES.length}) ${file}`);
  }
  fs.writeFileSync(path.join(dataDir, "downloaded.txt"), new Date().toISOString().slice(0, 10) + "\n");
  console.log("Listo. Ahora: npm run gamedata");
} catch (e) {
  console.error("Error: " + (e instanceof Error ? e.message : String(e)));
  process.exitCode = 1;
}
