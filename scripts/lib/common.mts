// Utilidades compartidas por los reductores de datos. Los tipos de lo que producen (GemRow, QuestRaw, TreeRaw…) son los
// mismos que lee la app: están en src/types.d.ts, que scripts/tsconfig.json incluye.
import fs from "node:fs";
import path from "node:path";

export const CLASSES = ["Marauder", "Duelist", "Ranger", "Shadow", "Witch", "Templar", "Scion"];
/** Lista de clases → máscara de bits en el orden de CLASSES; lista vacía = todas. */
export const classMask = (classes: string[]): ClassMask => classes.length ? classes.reduce((m, c) => m | 1 << CLASSES.indexOf(c), 0) : 127;
/** Id largo de una gema ("Metadata/Items/Gems/SkillGemFireball") → corto ("SkillGemFireball"). */
export const shortGemId = (id: string): string => id.replace("Metadata/Items/Gems/", "");
/** Lee un JSON de terceros; quien lo usa declara la forma que espera de él. */
export const readJson = <T,>(dir: string, file: string): T => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T;
