// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { exportLoadouts } from "../src/js/pob/leveling";
import { decode, encode, parseBuild } from "../src/js/pob";
import { parseTree } from "../src/js/pob/tree";
import { gemId } from "./helpers";

const cleave = gemId("Cleave"), melee = gemId("Melee Physical Damage Support"), vaal = gemId("Vaal Cleave");
const XML = `<PathOfBuilding><Build className="Marauder" mainSocketGroup="1"/>
  <Tree activeSpec="1"><Spec title="Final" classId="1" ascendClassId="0" treeVersion="3_25" nodes="" masteryEffects=""/></Tree>
  <Skills activeSkillSet="1"><SkillSet id="1" title="Default"><Skill><Gem nameSpec="Cleave"/><Gem nameSpec="Melee Physical Damage"/></Skill></SkillSet></Skills>
  <Items activeItemSet="1"><ItemSet id="1" title="Default"/><ItemSet id="2" title="Otro"/></Items>
  <Notes>Notas del autor</Notes></PathOfBuilding>`;
const stages = [
  { from: 1, to: 12, skill: cleave, supports: [melee], others: [vaal], nodes: [], note: "usa Cleave" },
  { from: 13, to: 28, skill: null, supports: [], others: [], nodes: [], note: "" },
];

describe("exportLoadouts", () => {
  const out = exportLoadouts(XML, stages), doc = new DOMParser().parseFromString(out, "application/xml");

  it("añade un árbol y un conjunto de habilidades por tramo con el mismo número de Loadout, y no toca lo que había", () => {
    expect([...doc.querySelectorAll("Tree > Spec")].map(s => s.getAttribute("title"))).toEqual(["Final", "Leveling 1 (nv 1-12) {1}", "Leveling 2 (nv 13-28) {2}"]);
    expect([...doc.querySelectorAll("Skills > SkillSet")].map(s => s.getAttribute("title"))).toEqual(["Default", "Leveling 1 (nv 1-12) {1}", "Leveling 2 (nv 13-28) {2}"]);
    expect(doc.querySelector("Tree")?.getAttribute("activeSpec")).toBe("1");
    expect(doc.querySelector("Tree > Spec")?.getAttribute("classId")).toBe("1");
  });

  it("enlaza el conjunto de objetos activo a todos los tramos cuando hay varios", () => {
    expect([...doc.querySelectorAll("ItemSet")].map(s => s.getAttribute("title"))).toEqual(["Default {1,2}", "Otro"]);
  });

  it("escribe la habilidad con sus soportes en un grupo y cada otra habilidad en el suyo", () => {
    const groups = [...doc.querySelectorAll("SkillSet")[1].querySelectorAll(":scope > Skill")].map(g => [...g.querySelectorAll("Gem")].map(x => x.getAttribute("nameSpec")));
    expect(groups).toEqual([["Cleave", "Melee Physical Damage"], ["Vaal Cleave"]]);
  });

  it("deja las notas del autor y añade las de los tramos, sin duplicarlas al repetir la exportación", () => {
    expect(doc.querySelector("Notes")?.textContent).toBe("Notas del autor\n\n== Mi leveling (poe-leveling-guide) ==\nLeveling 1 (nv 1-12): usa Cleave");
    expect(new DOMParser().parseFromString(exportLoadouts(out, stages), "application/xml").querySelector("Notes")?.textContent).toBe(doc.querySelector("Notes")?.textContent);
  });

  it("al leer el código exportado vuelven los tramos y las notas del autor quedan sin el bloque", async () => {
    const back = parseBuild(await decode(await encode(out)));
    expect(back.leveling).toEqual([
      { to: 12, skill: cleave, supports: [melee], others: [vaal], points: 0, note: "usa Cleave" },
      { to: 28, skill: null, supports: [], others: [], points: 0, note: "" },
    ]);
    expect(back.notes).toBe("Notas del autor");
    expect(back.tree.stages).toEqual([]);
  });
});

const parse = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");
const titles = (d: Document, q: string) => [...d.querySelectorAll(q)].map(e => e.getAttribute("title"));

describe("exportLoadouts repetido y con Loadouts del autor", () => {
  it("al exportar dos veces quedan solo los tramos de la segunda, y los números del conjunto de objetos no se acumulan", () => {
    const once = exportLoadouts(XML, stages), twice = exportLoadouts(once, [stages[0]]);
    const d = parse(twice);
    expect(titles(d, "Tree > Spec")).toEqual(["Final", "Leveling 1 (nv 1-12) {1}"]);
    expect(titles(d, "Skills > SkillSet")).toEqual(["Default", "Leveling 1 (nv 1-12) {1}"]);
    expect(titles(d, "ItemSet")).toEqual(["Default {1}", "Otro"]);
    expect(d.querySelector("Notes")?.textContent).toBe("Notas del autor\n\n== Mi leveling (poe-leveling-guide) ==\nLeveling 1 (nv 1-12): usa Cleave");
  });

  it("numera por encima de los Loadouts del autor, también si su {…} no va al final", () => {
    const xml = XML.replace('title="Final"', 'title="{3} Final"').replace('<ItemSet id="1" title="Default"/>', '<ItemSet id="1" title="Default {1,2}"/>');
    const d = parse(exportLoadouts(xml, stages));
    expect(titles(d, "Tree > Spec").slice(1)).toEqual(["Leveling 1 (nv 1-12) {4}", "Leveling 2 (nv 13-28) {5}"]);
    expect(titles(d, "ItemSet")[0]).toBe("Default {1,2,4,5}");
  });

  it("los conjuntos de ajustes también se enlazan, y el activo puede no ser el primero", () => {
    const xml = XML.replace("<Notes>", '<Config activeConfigSet="2"><ConfigSet id="1" title="A"/><ConfigSet id="2" title="B"/></Config><Notes>').replace('activeItemSet="1"', 'activeItemSet="2"');
    const d = parse(exportLoadouts(xml, stages));
    expect(titles(d, "ConfigSet")).toEqual(["A", "B {1,2}"]);
    expect(titles(d, "ItemSet")).toEqual(["Default", "Otro {1,2}"]);
  });

  it("un código con el formato antiguo, sin SkillSet, conserva sus grupos", () => {
    const old = XML.replace('<SkillSet id="1" title="Default">', "").replace("</SkillSet>", "");
    const d = parse(exportLoadouts(old, stages));
    expect(d.querySelectorAll("Skills > SkillSet")).toHaveLength(3);
    expect(d.querySelector("Skills > SkillSet")?.querySelectorAll("Gem")).toHaveLength(2);
  });

  it("un tramo sin habilidad principal vuelve sin ella aunque tenga otras habilidades", () => {
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [vaal], nodes: [], note: "" }]);
    expect(parseBuild(out).leveling).toEqual([{ to: 12, skill: null, supports: [], others: [vaal], points: 0, note: "" }]);
  });

  it("si PoB dejó activo un tramo, el árbol final es el primero que no lo es", () => {
    const d = parse(exportLoadouts(XML, stages).replace('activeSpec="1"', 'activeSpec="2"'));
    expect(parseTree(d).classId).toBe("1");
    expect(parseTree(d).stages).toEqual([]);
  });

  it("si PoB dejó activo el conjunto de habilidades de un tramo, la habilidad principal sigue siendo la del autor", () => {
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [vaal], nodes: [], note: "" }]);
    const build = parseBuild(out.replace('activeSkillSet="1"', 'activeSkillSet="2"'));
    expect(build.main?.id).toBe(cleave);
    expect(build.groups).toEqual([[cleave, melee]]);
  });

  it("un gemId como «constructor» no cuenta como gema", () => {
    const xml = '<PathOfBuilding><Build/><Tree><Spec nodes=""/></Tree><Skills><Skill><Gem gemId="Metadata/Items/Gems/constructor" nameSpec="x"/></Skill></Skills></PathOfBuilding>';
    expect(parseBuild(xml).gems.map(g => g.id)).toEqual([null]);
  });
});

describe("decode", () => {
  it("rechaza un código que se expande a más de 20 MB", async () => {
    const bomb = await encode("<a>" + "x".repeat(25 * 1024 * 1024) + "</a>");
    await expect(decode(bomb)).rejects.toThrow("demasiado grande");
  });
});
