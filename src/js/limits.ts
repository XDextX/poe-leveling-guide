/* Límites del juego que la sugerencia de leveling tiene que respetar: una sola maldición a la vez (las marcas cuentan como maldiciones) y una sola marca, salvo que algo dé más maldiciones. */

import { NODES, SKILLS } from "./data";

export const isMark = (id: string): boolean => !!SKILLS[id]?.tags.includes("mark");
// Hex: maldición que no es marca. Las marcas son maldiciones (comparten el límite de maldiciones) con además su propio límite de una.
export const isHex = (id: string): boolean => { const t = SKILLS[id]?.tags ?? []; return t.includes("curse") && !t.includes("mark"); };

/**
 * Cuántas maldiciones (hexes y marcas juntos) puede aplicar la build a la vez: una, más una por cada fuente de "You can apply an
 * additional Curse" en los nodos del árbol (Whispers of Doom, Occultist…) y en los objetos. Las marcas, además, solo pueden ser una
 * a la vez, y eso no se puede subir.
 */
export function curseLimit(treeNodes: string[], items: Item[] = []): number {
  const lines = [...treeNodes.flatMap(id => NODES[id]?.stats ?? []), ...items.flatMap(i => i.mods)];
  return 1 + lines.filter(l => /additional Curse/i.test(l)).length;
}

/**
 * Quita de los tramos lo que no cabe: más maldiciones (hexes y marcas cuentan juntos) que `curseLimit`, más de una marca, o una habilidad repetida en el mismo tramo.
 * Esto vale también para las habilidades de la propia build: en un tramo cuyo árbol aún no da más cupo no pueden estar a la vez,
 * y la guía lo dice en vez de enseñarlas todas. `stages` son las de cada habilidad para un mismo tramo, por orden de
 * importancia; las de la build van primero (y la principal antes que las otras). Se vacían en su sitio y guardan en `dropped`
 * qué se quitó.
 */
export function limitSkills(stages: StageSkill[], curseLimit: number, markLimit = 1): void {
  const kept = [...stages].sort((a, b) => +b.own - +a.own);   // sort estable: dentro de lo propio y de lo sugerido, el orden de entrada
  const seen = new Set<string>();
  let curses = 0, marks = 0;
  for (const st of kept) {
    const id = st.skill;
    if (!id) continue;
    const mark = isMark(id), curse = isHex(id) || mark;
    if (seen.has(id) || (curse && curses >= curseLimit) || (mark && marks >= markLimit)) { st.dropped = id; st.skill = null; st.supports = []; continue; }
    seen.add(id);
    if (curse) curses++;
    if (mark) marks++;
  }
}
