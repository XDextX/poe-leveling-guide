// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mainSkill, parseGems } from "../src/js/pob/gems";
import { gemId } from "./helpers";

/** El XML de una build de PoB, solo con sus habilidades. */
const skills = (inner: string, attrs = "") => new DOMParser().parseFromString(`<PathOfBuilding><Build ${attrs}/><Skills>${inner}</Skills></PathOfBuilding>`, "application/xml");
const gem = (name: string) => `<Gem nameSpec="${name}"/>`;

describe("parseGems", () => {
  it("lee las gemas de todos los conjuntos de habilidades, no solo del activo, y sin repetirlas", () => {
    const doc = skills(`
      <SkillSet id="1"><Skill>${gem("Cleave")}${gem("Melee Physical Damage")}</Skill></SkillSet>
      <SkillSet id="2"><Skill>${gem("Ground Slam")}${gem("cleave")}</Skill></SkillSet>`);
    expect(parseGems(doc).map(g => g.name)).toEqual(["Cleave", "Melee Physical Damage", "Ground Slam"]);
  });

  it("también sin conjuntos: las gemas directamente bajo Skills", () => {
    expect(parseGems(skills(`<Skill>${gem("Cleave")}</Skill>`)).map(g => g.name)).toEqual(["Cleave"]);
  });

  it("clasifica cada gema: normal, Vaal, transfigurada, despertada y desconocida", () => {
    const cleave = gemId("Cleave"), kinds = parseGems(skills(`<Skill>
      ${gem("Cleave")}${gem("Vaal Cleave")}${gem("Cleave of Rage")}${gem("Awakened Melee Splash Support")}${gem("Gema Inventada")}</Skill>`));
    expect(kinds.map(g => [g.name, g.kind])).toEqual([
      ["Cleave", "normal"], ["Vaal Cleave", "vaal"], ["Cleave of Rage", "transfigured"],
      ["Awakened Melee Splash Support", "awakened"], ["Gema Inventada", "unknown"],
    ]);
    // Las Vaal y las transfiguradas se consiguen a través de su gema base.
    expect(kinds.filter(g => g.base).map(g => g.base)).toEqual([cleave, cleave]);
  });
});

describe("mainSkill", () => {
  it("es la primera gema activa del grupo marcado como principal, con sus soportes", () => {
    const doc = skills(`<SkillSet id="1">
      <Skill>${gem("Herald of Ash")}</Skill>
      <Skill>${gem("Melee Physical Damage")}${gem("Cleave")}${gem("Faster Attacks")}</Skill></SkillSet>`, `mainSocketGroup="2"`);
    // PoB da los soportes sin el sufijo " Support"; en nuestros datos lo llevan.
    expect(mainSkill(doc)).toEqual({ id: gemId("Cleave"), supports: [gemId("Melee Physical Damage Support"), gemId("Faster Attacks Support")] });
  });

  it("sin habilidad activa en el grupo no hay principal", () => {
    expect(mainSkill(skills(`<Skill>${gem("Melee Physical Damage")}</Skill>`))).toBeNull();
  });
});
