import { describe, expect, it } from "vitest";
import { damageForm, damageProfile, elementFit, formFit, mainElements } from "../src/js/damage";
import { buildGuide } from "../src/js/guide";
import { build, gemId } from "./helpers";

const withMain = (name: string, supports: string[] = [], over: Partial<Build> = {}) => build({ main: { id: gemId(name), supports: supports.map(gemId) }, ...over });

describe("damageProfile", () => {
  it("toma los elementos de la habilidad principal y de sus soportes", () => {
    expect(mainElements(damageProfile(withMain("Frost Blades")))).toEqual(["cold"]);
    expect(mainElements(damageProfile(withMain("Wild Strike")))).toEqual(expect.arrayContaining(["fire", "cold", "lightning"]));
    // Los soportes del autor inclinan el perfil: Fire Penetration añade fuego a una habilidad de frío.
    const p = damageProfile(withMain("Frost Blades", ["Fire Penetration Support"]));
    expect(p.cold).toBeGreaterThan(p.fire);
    expect(p.fire).toBeGreaterThan(0);
  });

  it("un ataque sin elementos cuenta como físico", () => {
    expect(mainElements(damageProfile(withMain("Cleave")))).toEqual(["physical"]);
  });

  it("las líneas de daño elemental del equipo y del árbol suman al elemento", () => {
    const item = (mod: string): Item => ({ slot: "Ring 1", rarity: "RARE", name: "x", base: "y", req: 0, mods: [mod], implicits: 0 });
    const p = damageProfile(withMain("Cleave", [], { items: [item("Adds 5 to 9 Cold Damage to Attacks"), item("+30 to maximum Life")] }));
    expect(p.cold).toBe(0.25);
    expect(p.physical).toBe(2);
  });
});

describe("elementFit", () => {
  const cold = damageProfile(withMain("Frost Blades"));
  it("premia las gemas del elemento de la build, castiga las de otros y no toca las neutras", () => {
    expect(elementFit(gemId("Cold Penetration Support"), cold)).toBeGreaterThan(0);
    expect(elementFit(gemId("Fire Penetration Support"), cold)).toBeLessThan(0);
    expect(elementFit(gemId("Multistrike Support"), cold)).toBe(0);
  });
});

describe("leveling según el daño", () => {
  it("la guía dice qué elementos de daño ha deducido", () => {
    expect(buildGuide(withMain("Frost Blades", [], { groups: [[gemId("Frost Blades")]] }), { cls: "Shadow", leagueStart: true }).damage).toEqual(["cold"]);
  });

  it("para una build de frío, los soportes sugeridos no son de otro elemento mientras haya opciones neutras o de frío", () => {
    const { skills } = buildGuide(withMain("Frost Blades", [], { groups: [[gemId("Frost Blades")]] }), { cls: "Shadow", leagueStart: true });
    const last = skills.at(-1)!;
    const fit = last.supports.map(id => elementFit(id, damageProfile(withMain("Frost Blades"))));
    expect(last.supports.length).toBeGreaterThan(0);
    expect(fit.filter(f => f < 0).length).toBeLessThanOrEqual(1);
  });
});

describe("damageForm y formFit", () => {
  // Las cifras de una build de veneno real de PoB: los golpes son una fracción mínima del total.
  const poison = { TotalDPS: 46556.8, WithPoisonDPS: 8522001, WithIgniteDPS: 46556.8, WithBleedDPS: 46556.8, CombinedDPS: 9468890 };

  it("la forma de daño es la que más aporta: veneno si el veneno suma casi todo", () => {
    const f = damageForm(poison)!;
    expect(f.kind).toBe("poison");
    expect(f.share).toBeGreaterThan(0.99);
    expect(damageForm({ TotalDPS: 100000, WithPoisonDPS: 100000, WithIgniteDPS: 130000, WithBleedDPS: 100000 })!.kind).toBe("hit");
    expect(damageForm({ TotalDPS: 1000, WithBleedDPS: 9000 })!.kind).toBe("bleed");
  });

  it("sin estadísticas no hay forma", () => {
    expect(damageForm({})).toBeNull();
  });

  it("formFit premia las gemas que potencian la forma de daño y no las demás", () => {
    const form = damageForm(poison);
    expect(formFit(gemId("Unbound Ailments Support"), form)).toBe(1);
    expect(formFit(gemId("Void Manipulation Support"), form)).toBe(1);
    expect(formFit(gemId("Added Fire Damage Support"), form)).toBe(0);
    expect(formFit(gemId("Unbound Ailments Support"), null)).toBe(0);
  });

  it("para una build de veneno, la guía lo dice y sugiere soportes que lo potencian antes que los de golpes", () => {
    const b = withMain("Cleave", [], { stats: poison, groups: [[gemId("Cleave")]] });
    const g = buildGuide(b, { cls: "Marauder", leagueStart: true });
    expect(g.damageForm?.kind).toBe("poison");
    const last = g.skills.at(-1)!;
    expect(last.supports.some(id => formFit(id, g.damageForm) === 1)).toBe(true);
  });
});
