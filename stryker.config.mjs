// Pruebas de mutación (Stryker): cambia el código de src/js/ de pequeñas formas (un > por un >=, un true por un false…) y comprueba
// que alguna prueba falla; los mutantes que sobreviven son código que las pruebas no vigilan.
// Todo: npm run mutate   ·   Solo unos archivos: npm run mutate -- --mutate "src/js/pob/leveling.ts"
import os from "node:os";

export default {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  // La lógica, sin data.ts: solo lee window.DATA (los datos del juego), no tiene lógica que mutar.
  mutate: ["src/js/**/*.ts", "!src/js/data.ts"],
  // Con perTest cada mutante solo ejecuta las pruebas que cubren su línea.
  coverageAnalysis: "perTest",
  // Guarda el resultado y solo repite lo que cambió desde la última ejecución.
  incremental: true,
  incrementalFile: "reports/stryker-incremental.json",
  // La mitad de los núcleos: deja la máquina usable mientras corre.
  concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
  // Stryker reescribe el tsconfig.json con la API de JavaScript de TypeScript 5 (parseConfigFileTextToJson), que TypeScript 7 ya no tiene.
  // Vitest no comprueba tipos, así que se apunta a un archivo que no existe y Stryker se salta ese paso.
  tsconfigFile: "sin-tsconfig.json",
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation.html" },
  jsonReporter: { fileName: "reports/mutation.json" },
};
