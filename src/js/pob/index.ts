/* Lectura del código de exportación de Path of Building: clase, gemas, habilidad principal, equipo y árbol. */

import { userError } from "../errors";
import { mainSkill, parseGems, skillGroups } from "./gems";
import { parseItems } from "./items";
import { parseTree } from "./tree";

export { decode } from "./decode";

/** XML de PoB → la build: clase, ascendencia, bandidos, gemas sin repetir, equipo, árbol y habilidad principal. */
export function parseBuild(xml: string): Build {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror") || !doc.querySelector("PathOfBuilding")) throw userError("no es un código de Path of Building");
  const b = doc.querySelector("Build");
  return { cls: b?.getAttribute("className") ?? null, ascend: b?.getAttribute("ascendClassName") ?? null, bandit: b?.getAttribute("bandit") || "None",
    gems: parseGems(doc), items: parseItems(doc), tree: parseTree(doc), main: mainSkill(doc), groups: skillGroups(doc) };
}
