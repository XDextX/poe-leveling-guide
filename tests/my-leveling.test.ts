import { describe, expect, it } from "vitest";
import { applyTreeChange, clearLeveling, defaultLeveling, fromOf, mergeStage, ownOf, pointsAvailable, sanitizeLeveling, setTo, slotGroups, slotLines, splitStage, treeWarning, warnings } from "../src/js/my-leveling";
import { ADJ } from "../src/js/tree-graph";
import { CLASS_STARTS, NODES } from "../src/js/data";
import { NODE } from "../src/js/node-types";
import { gemId } from "./helpers";

const stage = (to: number, over: Partial<MyStage> = {}): MyStage => ({ to, skill: null, supports: [], others: [], nodes: [], note: "", ...over });
/** Una cadena de nodos conectados que sale del inicio de la clase 1 (cogibles: sin maestrías ni ascendencia), para probar con el árbol real. */
function chain(length: number): { start: string; line: string[] } {
  const start = CLASS_STARTS["1"], line: string[] = [], seen = new Set([start]);
  let cur = start;
  while (line.length < length) {
    const next = (ADJ.get(cur) ?? []).find(id => !seen.has(id) && !NODES[id].ascendancy && NODES[id].type !== NODE.MASTERY);
    if (!next) throw new Error("el árbol no tiene una cadena tan larga desde el inicio");
    line.push(next); seen.add(next); cur = next;
  }
  return { start, line };
}
const levels = (stages: MyStage[]) => stages.map((s, i) => [fromOf(stages, i), s.to]);

describe("tramos", () => {
  const stages = [stage(12), stage(28), stage(100)];

  it("cada tramo empieza donde acaba el anterior", () => {
    expect(levels(stages)).toEqual([[1, 12], [13, 28], [29, 100]]);
  });

  it("setTo no pasa del siguiente tramo ni baja de donde empieza", () => {
    expect(levels(setTo(stages, 0, 50))[0]).toEqual([1, 27]);
    expect(levels(setTo(stages, 1, 5))[1]).toEqual([13, 13]);
    expect(setTo(stages, 2, 500)[2].to).toBe(100);
  });

  it("splitStage parte por la mitad, y un tramo de un solo nivel no se parte", () => {
    expect(levels(splitStage(stages, 1))).toEqual([[1, 12], [13, 20], [21, 28], [29, 100]]);
    expect(splitStage([stage(5), stage(6)], 1)).toHaveLength(2);
  });

  it("mergeStage deja el contenido del siguiente, y el último no se junta con nada", () => {
    const merged = mergeStage([stage(12, { note: "a" }), stage(28, { note: "b" })], 0);
    expect(merged).toEqual([stage(28, { note: "b" })]);
    expect(mergeStage(stages, 2)).toBe(stages);
  });

  it("applyTreeChange: lo que se coge en un tramo pasa a los siguientes y los anteriores no cambian", () => {
    const { line } = chain(4);
    const three = [line[0], line[1], line[2]];
    const base = [stage(10), stage(20), stage(30, { nodes: [line[0]] })];
    const grown = applyTreeChange(base, 1, three, "1");
    expect(grown.map(s => s.nodes)).toEqual([[], three, [line[0], line[1], line[2]]]);
    // El tramo 3 ya tenía el primero por su cuenta: no se duplica.
    expect(grown[2].nodes.filter(id => id === line[0])).toHaveLength(1);
  });

  it("applyTreeChange: al quitar un nodo solo se quita de los tramos que lo heredaron de este", () => {
    const { line } = chain(3);
    // El tramo 1 coge los tres y el 2 los hereda; al quitar el tercero en el 1, el 2 lo pierde también.
    let stages = applyTreeChange([stage(10), stage(20)], 0, line, "1");
    expect(stages[1].nodes).toEqual(line);
    expect(ownOf(stages, 1)).toEqual([]);
    stages = applyTreeChange(stages, 0, line.slice(0, 2), "1");
    expect(stages.map(s => s.nodes)).toEqual([line.slice(0, 2), line.slice(0, 2)]);
  });

  it("applyTreeChange: lo que un tramo cogió por su cuenta se queda al quitarlo en uno anterior", () => {
    const { line } = chain(4);
    // El tramo 2 planea sus cuatro nodos por su cuenta; el tramo 1 coge los tres primeros y los vuelve a quitar.
    let stages: MyStage[] = [stage(10), stage(20, { nodes: line, own: line })];
    stages = applyTreeChange(stages, 0, [line[0], line[1], line[2]], "1");
    expect(stages[0].nodes).toEqual([line[0], line[1], line[2]]);
    expect(stages[1].nodes).toEqual(line);
    stages = applyTreeChange(stages, 0, [], "1");
    expect(stages[0].nodes).toEqual([]);
    expect(stages[1].nodes).toEqual(line);
  });

  it("applyTreeChange: de lo heredado se quita lo que sobra, pero no el camino hasta lo que el tramo cogió por su cuenta", () => {
    const { line } = chain(4);
    // El tramo 2 hereda los dos primeros y coge por su cuenta el tercero y el cuarto.
    let stages = applyTreeChange([stage(10), stage(20)], 0, [line[0], line[1]], "1");
    stages = applyTreeChange(stages, 1, line, "1");
    expect(ownOf(stages, 1)).toEqual([line[2], line[3]]);
    // Al quitar el segundo en el tramo 1, el 2 lo necesita para llegar a lo suyo: se queda.
    stages = applyTreeChange(stages, 0, [line[0]], "1");
    expect(stages[0].nodes).toEqual([line[0]]);
    expect(stages[1].nodes).toEqual(line);
  });

  it("pointsAvailable: un punto por nivel menos el primero y 24 de misiones", () => {
    expect([1, 10, 50].map(pointsAvailable)).toEqual([24, 33, 73]);
  });

  it("treeWarning avisa solo si se gastan más puntos de los que hay al nivel del tramo", () => {
    const nodes = Array.from({ length: pointsAvailable(10) + 1 }, (_, i) => String(i));
    expect(treeWarning({ nodes, to: 10 })).toContain("hay como mucho");
    expect(treeWarning({ nodes: nodes.slice(1), to: 10 })).toBe("");
  });

  it("clearLeveling vacía el contenido y mantiene dónde acaba cada tramo", () => {
    expect(clearLeveling([stage(12, { skill: "x", note: "n" }), stage(28, { nodes: ["1"] })])).toEqual([stage(12), stage(28)]);
  });
});

describe("defaultLeveling", () => {
  it("parte de lo sugerido para la habilidad principal y las demás", () => {
    const cleave = gemId("Cleave"), melee = gemId("Melee Physical Damage Support"), vaal = gemId("Vaal Cleave");
    const sug = (skill: string | null, supports: string[], to: number) => ({ acts: [1, 2], from: 1, to, skill, own: true, supports, mainAt: null, links: 4, options: [], recommended: null }) as StageSkill;
    const got = defaultLeveling({ skills: [sug(cleave, [melee], 12)], others: [{ skill: { id: vaal, supports: [] }, kind: "damage", stages: [sug(vaal, [], 12)] }] });
    expect(got).toEqual([{ to: 12, skill: cleave, supports: [melee], others: [{ skill: vaal, supports: [] }], nodes: [], note: "" }]);
  });
});

describe("warnings", () => {
  it("avisa de una gema que pide más nivel y de más soportes que enlaces", () => {
    const melee = gemId("Melee Physical Damage Support"), cleave = gemId("Cleave");
    expect(warnings(stage(60, { skill: cleave, supports: [melee] }))).toEqual([]);
    expect(warnings(stage(12, { skill: cleave, supports: [melee, melee, melee, melee] })).some(w => w.includes("soportes"))).toBe(true);
    expect(warnings(stage(1, { skill: cleave, supports: [melee] })).some(w => w.includes("pide nivel"))).toBe(true);
  });

  it("avisa también de los soportes de las otras habilidades", () => {
    const melee = gemId("Melee Physical Damage Support"), fireball = gemId("Fireball"), flame = gemId("Flame Dash");
    expect(warnings(stage(60, { others: [{ skill: fireball, supports: [melee] }] })).some(w => w.includes("no puede apoyar"))).toBe(true);
    expect(warnings(stage(60, { others: [{ skill: flame, supports: [] }] }))).toEqual([]);
  });

  it("avisa de un grupo de otra habilidad que no cabe en ninguna pieza del equipo", () => {
    const melee = gemId("Melee Physical Damage Support"), flame = gemId("Flame Dash");
    const big = { skill: flame, supports: [melee, melee, melee, melee, melee] };
    expect(warnings(stage(60, { skill: gemId("Cleave"), others: [big] })).some(w => w.includes("ninguna pieza (salvo el pecho"))).toBe(true);
    expect(warnings(stage(60, { skill: gemId("Cleave"), others: [{ skill: flame, supports: [] }] }))).toEqual([]);
  });

  it("el aviso de lo que no cabe dice la causa: demasiado grande para cualquier pieza, para las que quedan, o sin sitio", () => {
    const melee = gemId("Melee Physical Damage Support"), cleave = gemId("Cleave"), flame = gemId("Flame Dash"), cry = gemId("General's Cry");
    const warn = (to: number, others: MyOther[], supports: string[] = []) => warnings(stage(to, { skill: cleave, supports, others })).filter(w => w.includes("necesita") || w.includes("No queda"));
    // Nivel 23: 3 casillas por pieza. Una otra habilidad con 3 soportes (4 enlazadas) no cabe en ninguna pieza.
    expect(warn(23, [{ skill: flame, supports: [melee, melee, melee] }])).toEqual(["Flame Dash con 3 soportes necesita 4 enlazadas; con objetos de nivel ≈23 ninguna pieza pasa de 3. Quita 1 soporte o pásalo a un tramo de más nivel."]);
    // Nivel 40: el pecho da 5 y lo llena la principal; otra de 5 enlazadas solo cabría en el pecho, que ya está ocupado.
    expect(warn(40, [{ skill: flame, supports: [melee, melee, melee, melee] }], [melee, melee, melee, melee])).toEqual(["Flame Dash con 4 soportes necesita 5 enlazadas; con objetos de nivel ≈40 ninguna pieza (salvo el pecho, que ya está ocupado) pasa de 4. Quita 1 soporte o pásalo a un tramo de más nivel."]);
    // Seis grupos de 3 a nivel 1 llenan pecho, casco, guantes, botas y las dos armas (la principal ocupa el pecho): el séptimo no tiene sitio.
    const three = (skill: string): MyOther => ({ skill, supports: [melee, melee] });
    expect(warn(1, [three(flame), three(flame), three(flame), three(flame), three(flame), three(cry)], [melee, melee]).at(-1)).toBe("No queda sitio para General's Cry: los demás grupos ocupan el equipo. Quita otra habilidad o algún soporte.");
  });

  it("un soporte que no apoya a la habilidad, una habilidad que no lo es y soportes sin habilidad", () => {
    const melee = gemId("Melee Physical Damage Support"), fireball = gemId("Fireball");
    expect(warnings(stage(60, { skill: fireball, supports: [melee] })).some(w => w.includes("no puede apoyar"))).toBe(true);
    expect(warnings(stage(60, { skill: melee })).some(w => w.includes("no es una habilidad"))).toBe(true);
    expect(warnings(stage(60, { supports: [melee] }))).toEqual(["Hay soportes pero ninguna habilidad."]);
  });
});

describe("slotGroups", () => {
  const cleave = gemId("Cleave"), melee = gemId("Melee Physical Damage Support"), herald = gemId("Herald of Ash"), dash = gemId("Flame Dash"), cry = gemId("General's Cry");

  it("las otras habilidades que caen en la misma pieza van en un solo grupo, y la principal aparte", () => {
    // Nivel 40: el pecho da 5; la principal (cinco gemas) lo llena y las otras (una cada una) van juntas al casco.
    const groups = slotGroups({ skill: cleave, supports: [melee, melee, melee, melee], others: [{ skill: herald, supports: [] }, { skill: dash, supports: [] }], to: 40 });
    expect(groups.map(g => [g.slot, g.ids.length, g.main])).toEqual([["Body Armour", 5, true], ["Helmet", 2, false]]);
    expect(groups[1].ids).toEqual([herald, dash]);
    expect(slotLines({ skill: cleave, supports: [melee, melee, melee, melee], others: [{ skill: herald, supports: [] }, { skill: dash, supports: [] }], to: 40 }))
      .toEqual(["Pecho — Cleave + 4 soportes (5 enlazadas)", "Casco — Herald of Ash, Flame Dash"]);
    expect(slotLines({ skill: cleave, supports: [melee], others: [{ skill: herald, supports: [melee] }], to: 40 })).toEqual(["Pecho — Cleave + 1 soporte (2 enlazadas)", "Pecho — Herald of Ash + 1 soporte (2 enlazadas)"]);
  });

  it("los soportes de cada otra habilidad viajan con ella al grupo de su pieza, y lo que no cabe queda suelto", () => {
    const groups = slotGroups({ skill: cleave, supports: [], others: [{ skill: herald, supports: [melee] }, { skill: dash, supports: [melee] }, { skill: cry, supports: [melee, melee, melee, melee, melee, melee] }], to: 1 });
    // Nivel 1: 3 casillas por pieza. La de 7 gemas no cabe en ninguna; las de 2 se reparten: la primera al hueco del pecho, la otra al casco.
    expect(groups.map(g => [g.slot, g.ids])).toEqual([["Body Armour", [cleave]], ["Body Armour", [herald, melee]], ["Helmet", [dash, melee]], [null, [cry, melee, melee, melee, melee, melee, melee]]]);
  });

  it("sin habilidad principal no hay grupo principal", () => {
    expect(slotGroups({ skill: null, supports: [], others: [{ skill: herald, supports: [] }], to: 40 }).map(g => g.main)).toEqual([false]);
  });
});

describe("sanitizeLeveling", () => {
  const cleave = gemId("Cleave"), real = Object.keys(NODES)[0];

  it("deja pasar tramos válidos y quita los ids de gema que no existen", () => {
    expect(sanitizeLeveling([{ to: 12, skill: cleave, supports: [cleave, "nada", "constructor"], others: ["__proto__"], nodes: [real, "nada", "constructor", real], note: "x" }]))
      .toEqual([{ to: 12, skill: cleave, supports: [cleave], others: [], nodes: [real], note: "x" }]);
    expect(sanitizeLeveling([{ to: 12, skill: "constructor", supports: [], others: [], nodes: null, note: 3 }])).toEqual([{ to: 12, skill: null, supports: [], others: [], nodes: [], note: "" }]);
  });

  it("entiende las otras habilidades guardadas antes como un id suelto, y con sus soportes", () => {
    const melee = gemId("Melee Physical Damage Support"), vaal = gemId("Vaal Cleave");
    const got = sanitizeLeveling([{ to: 12, skill: null, supports: [], others: [vaal, { skill: cleave, supports: [melee, "nada"] }, { skill: "constructor", supports: [] }, null], points: 0, note: "" }]);
    expect(got?.[0].others).toEqual([{ skill: vaal, supports: [] }, { skill: cleave, supports: [melee] }]);
  });

  it("guarda qué nodos cogió el jugador en cada tramo, solo los que están en el tramo", () => {
    const [a, b] = Object.keys(NODES);
    const got = sanitizeLeveling([{ to: 12, nodes: [a], own: [a, b, "nada"] }, { to: 20, nodes: [a, b], own: "no" }]);
    expect(got?.[0].own).toEqual([a]);
    expect(got?.[1].own).toBeUndefined();
  });

  it("descarta lo que no es una lista de tramos con niveles que suben", () => {
    for (const bad of [null, {}, [], "x", [{ to: "a" }], [{ to: 0 }], [{ to: 20 }, { to: 20 }], [{ to: 30 }, { to: 20 }], [{ to: 101 }], [null]]) expect(sanitizeLeveling(bad), JSON.stringify(bad)).toBeUndefined();
  });
});
