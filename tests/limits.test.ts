import { describe, expect, it } from "vitest";
import { NODES } from "../src/js/data";
import { curseLimit, limitSkills } from "../src/js/limits";
import { gemId } from "./helpers";

const stage = (skill: string | null, own = false): StageSkill => ({ acts: [1, 2], from: 1, to: 10, skill, own, supports: skill ? [gemId("Pierce Support")] : [], mainAt: null, links: 6 });
const ids = (...st: StageSkill[]) => st.map(s => s.skill);
const [despair, enfeeble, sniper, assassin, cleave] = ["Despair", "Enfeeble", "Sniper's Mark", "Assassin's Mark", "Cleave"].map(gemId);

describe("limitSkills", () => {
  it("deja una sola maldición, marcas incluidas, y quita el resto de lo sugerido junto con sus soportes", () => {
    const [a, b, c, d, e] = [stage(despair), stage(enfeeble), stage(sniper), stage(assassin), stage(cleave)];
    limitSkills([a, b, c, d, e], 1);
    expect(ids(a, b, c, d, e)).toEqual([despair, null, null, null, cleave]);
    expect(b.supports).toEqual([]);
    expect(a.supports).toHaveLength(1);
  });

  it("una marca gasta un hueco de maldiciones, y con más cupo caben maldiciones pero solo una marca", () => {
    const [a, b] = [stage(sniper), stage(despair)];
    limitSkills([a, b], 1);
    expect(ids(a, b)).toEqual([sniper, null]);
    const [x, y, z, w] = [stage(despair), stage(enfeeble), stage(sniper), stage(assassin)];
    limitSkills([x, y, z, w], 3);
    expect(ids(x, y, z, w)).toEqual([despair, enfeeble, sniper, null]);
  });

  it("también limita las de la propia build, con las suyas primero, y anota qué se quitó", () => {
    const [sug, own1, own2, own3] = [stage(despair), stage(enfeeble, true), stage(sniper, true), stage(assassin, true)];
    limitSkills([sug, own1, own2, own3], 1);
    expect(ids(sug, own1, own2, own3)).toEqual([null, enfeeble, null, null]);
    expect([sug.dropped, own2.dropped, own3.dropped, own1.dropped]).toEqual([despair, sniper, assassin, undefined]);
    const [o1, o2] = [stage(despair, true), stage(enfeeble, true)];
    limitSkills([o1, o2], 1);
    expect(ids(o1, o2)).toEqual([despair, null]);
  });

  it("no repite una habilidad sugerida en el mismo tramo", () => {
    const [a, b] = [stage(cleave), stage(cleave)];
    limitSkills([a, b], 1);
    expect(ids(a, b)).toEqual([cleave, null]);
  });
});

describe("curseLimit", () => {
  const nodeWith = (re: RegExp) => Object.keys(NODES).find(id => NODES[id].stats.some(s => re.test(s)))!;
  it("es una más una por cada fuente de maldición adicional en el árbol o el equipo", () => {
    expect(curseLimit([])).toBe(1);
    const doom = nodeWith(/additional Curse/i);
    expect(curseLimit([doom])).toBe(2);
    expect(curseLimit([], [{ slot: "Ring 1", rarity: "UNIQUE", name: "x", base: "y", req: 0, mods: ["You can apply an additional Curse"], implicits: 0 }])).toBe(2);
  });
});
