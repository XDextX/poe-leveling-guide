import { describe, expect, it } from "vitest";
import { buildGuide } from "../src/js/guide";
import { build, gemId } from "./helpers";

describe("buildGuide", () => {
  it("no marca como sugerida la gema base de una Vaal de la build, aunque el leveling la proponga", () => {
    const cleave = gemId("Cleave");
    const data = buildGuide(build({
      gems: [{ name: "Vaal Cleave", id: null, kind: "vaal", base: cleave }],
      main: { id: cleave, supports: [] },
    }), { cls: "Marauder", leagueStart: true });
    expect(data.skills.length).toBeGreaterThan(0);
    expect(data.suggested.has(cleave)).toBe(false);
    // La base sí se busca en la campaña, porque es como se consigue la Vaal.
    expect(data.plan.got.has(cleave)).toBe(true);
  });

  it("da la ascendencia solo si se ve la clase de la build y no es None", () => {
    const shadow = build({ cls: "Shadow", ascend: "Assassin" });
    expect(buildGuide(shadow, { cls: "Shadow", leagueStart: true })).toMatchObject({ cls: "Shadow", ascend: "Assassin" });
    expect(buildGuide(shadow, { cls: "Witch", leagueStart: true })).toMatchObject({ cls: "Witch", ascend: null });
    expect(buildGuide(build({ cls: "Shadow", ascend: "None" }), { cls: "Shadow", leagueStart: true }).ascend).toBeNull();
  });

  it("con árboles propios de la build los usa para el mapa y no los reparte por tramos de leveling", () => {
    const stages = [{ title: "Acto 3", nodes: [] }, { title: "Final", nodes: [] }];
    const data = buildGuide(build({ tree: { nodes: [], masteries: [], classId: "1", stages } }), { cls: "Marauder", leagueStart: true });
    expect(data).toMatchObject({ treeStages: stages, treesSuggested: false, levelingTrees: [] });
  });

  it("sin árboles propios ni clase en el árbol no sugiere ninguno", () => {
    const data = buildGuide(build(), { cls: "Marauder", leagueStart: true });
    expect(data).toMatchObject({ treeStages: [], treesSuggested: true, levelingTrees: [] });
  });
});

describe("plan de la ruta", () => {
  it("marca como zona los pasos que cambian de zona, y solo esos", () => {
    const { out } = buildGuide(build(), { cls: "Marauder", leagueStart: true }).plan;
    const zones = out.filter(s => s.zone);
    expect(zones.length).toBeGreaterThan(5);
    // "Waypoint ➞ X" y "➞ X" cambian de zona; "Busca y mata a Hillock" no.
    expect(zones.some(s => /^➞ /.test(s.text.replace(/<[^>]*>/g, "")) || s.text.includes('class="wp"'))).toBe(true);
    expect(out.find(s => s.text.includes("Hillock"))?.zone).toBe(false);
  });
});

describe("recompensas y compras de una misión", () => {
  // Mercy Mission tiene dos ofertas de Nessa: una de frascos y otra de gemas de soporte; la segunda es gratis y la primera las vende.
  it("lleva gratis una gema que se ofrece de recompensa y compra solo las demás", () => {
    const prolif = gemId("Elemental Proliferation Support"), pierce = gemId("Pierce Support");
    const { out } = buildGuide(build({
      cls: "Shadow",
      gems: [{ name: "Elemental Proliferation Support", id: prolif, kind: "normal" }, { name: "Pierce Support", id: pierce, kind: "normal" }],
    }), { cls: "Shadow", leagueStart: true }).plan;
    const groups = out.find(s => s.text.includes("Mercy Mission"))!.gems;
    expect(groups.filter(g => g.how === "Recompensa")).toHaveLength(1);
    const reward = groups.find(g => g.how === "Recompensa")!.ids[0];
    expect([prolif, pierce]).toContain(reward);
    // La otra no es de recompensa: se compra a Nessa.
    expect(groups.find(g => g.buy)?.ids).toEqual([reward === prolif ? pierce : prolif]);
  });
});
