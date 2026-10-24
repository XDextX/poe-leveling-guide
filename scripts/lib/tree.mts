// Árbol de pasivas oficial (GGG skilltree-export) reducido a posiciones, stats, conexiones, maestrías e inicios de clase.

// Las órbitas de 16 y 40 nodos no son equidistantes; estos ángulos son los mismos que usa Path of Building.
const ANGLES: Record<number, number[]> = { 16: [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330],
  40: [0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 140, 150, 160, 170, 180, 190, 200, 210, 220, 225, 230, 240, 250, 260, 270, 280, 290, 300, 310, 315, 320, 330, 340, 350] };
// Mismos valores que NODE en src/js/data.ts.
const TYPE = { SMALL: 0, NOTABLE: 1, KEYSTONE: 2, MASTERY: 3, JEWEL: 4, START: 5 } as const;

/** Lo que leemos de data.json de skilltree-export. */
export interface SourceNode {
  name?: string; stats?: string[]; group?: number; orbit: number; orbitIndex: number; out?: string[];
  isProxy?: boolean; isKeystone?: boolean; isMastery?: boolean; isNotable?: boolean; isJewelSocket?: boolean;
  expansionJewel?: unknown; classStartIndex?: number; ascendancyName?: string;
  masteryEffects?: { effect: number; stats: string[] }[]; reminderText?: string[]; icon?: string;
}
type Sprite = Record<string, { filename: string; w: number; h: number; coords: Record<string, { x: number; y: number; w: number; h: number }> }>;
export interface SourceTree {
  constants: { skillsPerOrbit: number[]; orbitRadii: number[] };
  groups: Record<string, { x: number; y: number }>;
  nodes: Record<string, SourceNode>;
  sprites: Record<string, Sprite>;
}
// Hoja de iconos por tipo de nodo, al zoom más alto de los que da el export.
const SPRITE: Partial<Record<number, string>> = { [TYPE.SMALL]: "normalActive", [TYPE.NOTABLE]: "notableActive", [TYPE.KEYSTONE]: "keystoneActive", [TYPE.MASTERY]: "mastery" };

/** Nodos con su posición ya calculada, aristas en un array plano y el nodo inicial de cada clase (índice = classId de PoB). */
export function reduceTree(tree: SourceTree): TreeRaw {
  const { skillsPerOrbit, orbitRadii } = tree.constants;
  const T: TreeRaw = { nodes: {}, edges: [], masteries: {}, starts: {}, sheets: [] };
  const sheetOf = new Map<string, number>();
  const icon = (type: number, path?: string): NodeRow[7] => {
    const key = SPRITE[type], zooms = key && tree.sprites[key], sheet = zooms && zooms[Object.keys(zooms).at(-1)!], c = sheet && path && sheet.coords[path];
    if (!c) return 0;
    if (!sheetOf.has(sheet.filename)) { sheetOf.set(sheet.filename, T.sheets.length); T.sheets.push([sheet.filename, sheet.w, sheet.h]); }
    return [sheetOf.get(sheet.filename)!, c.x, c.y, c.w, c.h];
  };
  for (const [id, n] of Object.entries(tree.nodes)) {
    const g = n.group !== undefined ? tree.groups[n.group] : undefined;
    if (!g || n.isProxy || n.expansionJewel && !n.isJewelSocket) continue;
    const count = skillsPerOrbit[n.orbit], r = orbitRadii[n.orbit];
    const a = (ANGLES[count] ? ANGLES[count][n.orbitIndex] : 360 * n.orbitIndex / count) * Math.PI / 180;
    const type = n.isKeystone ? TYPE.KEYSTONE : n.isMastery ? TYPE.MASTERY : n.isJewelSocket ? TYPE.JEWEL
      : n.classStartIndex !== undefined ? TYPE.START : n.isNotable ? TYPE.NOTABLE : TYPE.SMALL;
    T.nodes[id] = [Math.round(g.x + r * Math.sin(a)), Math.round(g.y - r * Math.cos(a)), type, n.name || "", (n.stats || []).join("\n"), n.ascendancyName || "",
      (n.reminderText || []).join("\n"), n.ascendancyName ? 0 : icon(type, n.icon)];
    if (n.classStartIndex !== undefined) T.starts[n.classStartIndex] = id;
    if (n.masteryEffects) T.masteries[id] = Object.fromEntries(n.masteryEffects.map(e => [e.effect, e.stats.join("\n")]));
  }
  for (const [id, n] of Object.entries(tree.nodes))
    for (const o of n.out || []) {
      const a = T.nodes[id], b = T.nodes[o];
      // Ni aristas hacia maestrías ni entre la ascendencia y el árbol principal: no son caminos reales.
      if (a && b && a[2] !== TYPE.MASTERY && b[2] !== TYPE.MASTERY && a[5] === b[5]) T.edges.push(+id, +o);
    }
  return T;
}
