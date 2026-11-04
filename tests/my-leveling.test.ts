import { describe, expect, it } from "vitest";
import { clearLeveling, defaultLeveling, fromOf, mergeStage, setPoints, setTo, splitStage, warnings } from "../src/js/my-leveling";
import { gemId } from "./helpers";

const stage = (to: number, over: Partial<MyStage> = {}): MyStage => ({ to, skill: null, supports: [], others: [], points: 10, note: "", ...over });
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

  it("setPoints no baja de los puntos del tramo anterior", () => {
    expect(setPoints([stage(12, { points: 20 }), stage(28)], 1, 5)[1].points).toBe(20);
  });

  it("clearLeveling vacía el contenido y mantiene dónde acaba cada tramo", () => {
    expect(clearLeveling([stage(12, { skill: "x", note: "n" }), stage(28, { points: null })])).toEqual([stage(12, { points: 0 }), stage(28, { points: null })]);
  });
});

describe("defaultLeveling", () => {
  it("parte de lo sugerido para la habilidad principal y las demás", () => {
    const cleave = gemId("Cleave"), melee = gemId("Melee Physical Damage Support"), vaal = gemId("Vaal Cleave");
    const sug = (skill: string | null, supports: string[], to: number) => ({ acts: [1, 2], from: 1, to, skill, own: true, supports, mainAt: null, links: 4, options: [], recommended: null }) as StageSkill;
    const got = defaultLeveling({ skills: [sug(cleave, [melee], 12)], others: [{ skill: { id: vaal, supports: [] }, kind: "damage", stages: [sug(vaal, [], 12)] }], levelingTrees: [{ title: "t", nodes: [], points: 20 }], treesSuggested: true });
    expect(got).toEqual([{ to: 12, skill: cleave, supports: [melee], others: [vaal], points: 20, note: "" }]);
  });
});

describe("warnings", () => {
  it("avisa de una gema que pide más nivel y de más soportes que enlaces", () => {
    const melee = gemId("Melee Physical Damage Support"), cleave = gemId("Cleave");
    expect(warnings(stage(60, { skill: cleave, supports: [melee] }))).toEqual([]);
    expect(warnings(stage(12, { skill: cleave, supports: [melee, melee, melee, melee] })).some(w => w.includes("soportes"))).toBe(true);
    expect(warnings(stage(1, { skill: cleave, supports: [melee] })).some(w => w.includes("pide nivel"))).toBe(true);
  });
});
