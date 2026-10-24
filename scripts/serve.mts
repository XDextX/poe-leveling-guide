// Sirve dist/ en local. Uso: npm run serve   (antes: npm run build; otro puerto: PORT=3000 npm run serve)
import fs from "node:fs";
import path from "node:path";
import { serve } from "./lib/server.mts";

const dist = path.join(import.meta.dirname, "..", "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("No hay dist/: genera la web antes con npm run build.");
  process.exit(1);
}
serve(dist, Number(process.env.PORT) || 8080);
