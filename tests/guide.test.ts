import { describe, expect, it } from "vitest";
import { buildGuide } from "../src/js/guide";
import { isHex, isMark } from "../src/js/limits";
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

describe("leveling de las otras habilidades", () => {
  const cleave = gemId("Cleave");
  const data = () => buildGuide(build({
    gems: [cleave, "Flame Dash", "Determination", "Herald of Ice"].map(n => ({ name: n === cleave ? "Cleave" : n, id: n === cleave ? cleave : gemId(n), kind: "normal" as const })),
    main: { id: cleave, supports: [] },
    groups: [[cleave], [gemId("Flame Dash")], [gemId("Determination")], [gemId("Herald of Ice")]],
  }), { cls: "Marauder", leagueStart: true });

  it("da un leveling por cada habilidad que no es la principal, de supervivencia a comodidad", () => {
    const { others } = data();
    expect(others.map(o => o.kind)).toEqual(["survival", "damage", "qol"]);
    expect(others.map(o => o.skill.id)).toEqual([gemId("Determination"), gemId("Herald of Ice"), gemId("Flame Dash")]);
    expect(others.every(o => o.stages.length === 4)).toBe(true);
  });

  it("solo sustituye las maldiciones y las marcas, y por otra del mismo tipo; el resto sale cuando se consigue y si no, nada", () => {
    for (const o of data().others) for (const st of o.stages) expect([null, o.skill.id]).toContain(st.skill);
    const despair = gemId("Despair"), assassin = gemId("Assassin's Mark");
    const g = buildGuide(build({
      gems: [{ name: "Assassin's Mark", id: assassin, kind: "normal" }, { name: "Despair", id: despair, kind: "normal" }],
      main: { id: cleave, supports: [] },
      groups: [[cleave], [assassin], [despair]],
    }), { cls: "Marauder", leagueStart: true });
    const first = Object.fromEntries(g.others.map(o => [o.skill.id, o.stages[0].skill]));
    // En los primeros actos, lo que no se consigue aún se cambia por una marca o una maldición (según el tipo), nunca por otra cosa.
    const a = first[assassin], d = first[despair];
    expect(a === null || isMark(a)).toBe(true);
    expect(d === null || (isHex(d) && !isMark(d))).toBe(true);
  });

  it("cada gema activa de un grupo es una habilidad aparte, con los soportes del grupo", () => {
    const flesh = gemId("Flesh and Stone"), dash = gemId("Flame Dash"), pierce = gemId("Pierce Support");
    const { others } = buildGuide(build({
      gems: [], main: { id: cleave, supports: [] },
      groups: [[cleave], [flesh, dash, pierce]],
    }), { cls: "Marauder", leagueStart: true });
    expect(others.map(o => o.skill.id)).toEqual([flesh, dash]);
    expect(others.every(o => o.skill.supports.includes(pierce))).toBe(true);
  });

  it("cuenta las sugeridas de las otras en las gemas que la guía busca en la ruta", () => {
    const d = data();
    const fromOthers = d.others.flatMap(o => o.stages).flatMap(s => [s.skill, ...s.supports]).filter((id): id is string => !!id);
    expect(fromOthers.every(id => d.suggested.has(id) || d.build.gems.some(g => g.id === id))).toBe(true);
  });
});

describe("casillas por nivel de objeto", () => {
  it("los soportes sugeridos caben en los enlaces del tramo: skill + soportes ≤ links", () => {
    const cleave = gemId("Cleave");
    const { skills } = buildGuide(build({ main: { id: cleave, supports: [] }, groups: [[cleave]] }), { cls: "Marauder", leagueStart: true });
    expect(skills.length).toBeGreaterThan(0);
    for (const st of skills) expect(1 + st.supports.length).toBeLessThanOrEqual(st.links);
    // Los objetos de los primeros actos tienen pocas casillas; los del final, seis.
    expect(skills[0].links).toBeLessThan(skills.at(-1)!.links);
  });
});
