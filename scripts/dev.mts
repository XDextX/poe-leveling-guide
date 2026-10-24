// Desarrollo: genera dist/, la sirve en local y la vuelve a generar al cambiar src/, gamedata/ o public/ (recarga el navegador a mano).
// Uso: npm run dev   (otro puerto: PORT=3000 npm run dev)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { serve } from "./lib/server.mts";

const root = path.join(import.meta.dirname, "..");
// El build va en otro proceso: así cada vez se leen los archivos de nuevo y un error no tira el servidor.
const build = (): boolean => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", path.join(root, "scripts", "build.mts")], { stdio: "inherit" }).status === 0;

if (!build()) console.error("El build ha fallado: corrige el error y guarda de nuevo.");
serve(path.join(root, "dist"), Number(process.env.PORT) || 8080);

// Un guardado suele disparar varios eventos seguidos: se espera a que paren 150 ms y se genera una sola vez.
let timer: NodeJS.Timeout | undefined;
for (const dir of ["src", "gamedata", "public"]) {
  fs.watch(path.join(root, dir), { recursive: true }, (_event, file) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\nCambió ${dir}/${file?.replaceAll("\\", "/") ?? ""}: generando de nuevo…`);
      if (!build()) console.error("El build ha fallado: corrige el error y guarda de nuevo.");
    }, 150);
  });
}
console.log("Vigilando src/, gamedata/ y public/. Ctrl+C para parar.");
