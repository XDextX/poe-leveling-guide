// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { exportLoadouts } from "../src/js/pob/leveling";
import { decode, encode, parseBuild } from "../src/js/pob";
import { parseTree } from "../src/js/pob/tree";
import { CLASS_STARTS, NODES } from "../src/js/data";
import { NODE } from "../src/js/node-types";
import { pickable } from "../src/js/tree-graph";
import { gemId } from "./helpers";

const cleave = gemId("Cleave"), melee = gemId("Melee Physical Damage Support"), vaal = gemId("Vaal Cleave");
const XML = `<PathOfBuilding><Build className="Marauder" mainSocketGroup="1"/>
  <Tree activeSpec="1"><Spec title="Final" classId="1" ascendClassId="0" treeVersion="3_25" nodes="" masteryEffects=""/></Tree>
  <Skills activeSkillSet="1"><SkillSet id="1" title="Default"><Skill><Gem nameSpec="Cleave"/><Gem nameSpec="Melee Physical Damage"/></Skill></SkillSet></Skills>
  <Items activeItemSet="1"><ItemSet id="1" title="Default"/><ItemSet id="2" title="Otro"/></Items>
  <Notes>Notas del autor</Notes></PathOfBuilding>`;
const stages = [
  { from: 1, to: 12, skill: cleave, supports: [melee], others: [{ skill: vaal, supports: [melee] }], nodes: [], note: "usa Cleave" },
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
    expect(groups).toEqual([["Cleave", "Melee Physical Damage"], ["Vaal Cleave", "Melee Physical Damage"]]);
  });

  it("deja las notas del autor y añade las de los tramos, sin duplicarlas al repetir la exportación", () => {
    expect(doc.querySelector("Notes")?.textContent).toBe("Notas del autor\n\n== Mi leveling (poe-leveling-guide) ==\nLeveling 1 (nv 1-12): usa Cleave");
    expect(new DOMParser().parseFromString(exportLoadouts(out, stages), "application/xml").querySelector("Notes")?.textContent).toBe(doc.querySelector("Notes")?.textContent);
  });

  it("al leer el código exportado vuelven los tramos y las notas del autor quedan sin el bloque", async () => {
    const back = parseBuild(await decode(await encode(out)));
    expect(back.leveling).toEqual([
      { to: 12, skill: cleave, supports: [melee], others: [{ skill: vaal, supports: [melee] }], nodes: [], note: "usa Cleave" },
      { to: 28, skill: null, supports: [], others: [], nodes: [], note: "" },
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

  it("escribe cada grupo en una pieza del equipo donde caben sus enlaces, la principal en el pecho", () => {
    const d = parse(exportLoadouts(XML, [{ from: 1, to: 60, skill: cleave, supports: [melee], others: [{ skill: vaal, supports: [] }, { skill: vaal, supports: [melee, melee, melee, melee, melee] }], nodes: [], note: "" }]));
    const groups = [...d.querySelectorAll("SkillSet")[1].querySelectorAll(":scope > Skill")].map(g => [g.getAttribute("label"), g.getAttribute("slot"), g.querySelectorAll("Gem").length]);
    // Nivel 60: el pecho da 6 casillas y casco, guantes y botas 4. La principal (2) va al pecho, la otra de 1 al hueco que queda en
    // el pecho, y la de 6 no cabe en ninguna pieza: queda sin slot.
    expect(groups).toEqual([["Principal", "Body Armour", 2], ["", "Body Armour", 1], ["", "", 6]]);
  });

  it("las otras habilidades de una misma pieza se escriben juntas en un grupo, y al volver se separan de nuevo", () => {
    const herald = gemId("Herald of Ash"), dash = gemId("Flame Dash");
    const out = exportLoadouts(XML, [{ from: 1, to: 40, skill: cleave, supports: [melee, melee, melee, melee], others: [{ skill: herald, supports: [] }, { skill: dash, supports: [] }], nodes: [], note: "" }]);
    const groups = [...parse(out).querySelectorAll("SkillSet")[1].querySelectorAll(":scope > Skill")].map(g => [g.getAttribute("slot"), g.querySelectorAll("Gem").length]);
    expect(groups).toEqual([["Body Armour", 5], ["Helmet", 2]]);
    expect(parseBuild(out).leveling).toEqual([{ to: 40, skill: cleave, supports: [melee, melee, melee, melee], others: [{ skill: herald, supports: [] }, { skill: dash, supports: [] }], nodes: [], note: "" }]);
  });

  it("los nodos del árbol de cada tramo se escriben tal cual y vuelven al importar; los ids que no existen no", () => {
    const real = Object.keys(NODES).filter(id => pickable(id, "1")).slice(0, 5);
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [], nodes: real, note: "" }]);
    expect(parse(out).querySelectorAll("Tree > Spec")[1].getAttribute("nodes")).toBe(real.join(","));
    expect(parseBuild(out).leveling![0].nodes).toEqual(real);
    const sucio = out.replace(`nodes="${real.join(",")}"`, `nodes="${real.join(",")},no-existe,constructor"`);
    expect(parseBuild(sucio).leveling![0].nodes).toEqual(real);
  });

  it("los árboles de los tramos salen sin las maestrías del árbol final de la build, aunque el árbol activo las traiga", () => {
    const withMasteries = XML.replace('masteryEffects=""', 'masteryEffects="{1,2}"');
    const specs = parse(exportLoadouts(withMasteries, [{ from: 1, to: 12, skill: null, supports: [], others: [], nodes: [], note: "" }])).querySelectorAll("Tree > Spec");
    expect(specs[0].getAttribute("masteryEffects")).toBe("{1,2}");
    expect(specs[1].getAttribute("masteryEffects")).toBe("");
  });

  it("al importar solo entran los nodos que se pueden coger: sin maestrías, ascendencia ni inicios", () => {
    const keys = Object.keys(NODES);
    const asc = keys.find(id => NODES[id].ascendancy)!, mastery = keys.find(id => NODES[id].type === NODE.MASTERY && !NODES[id].ascendancy)!;
    const plain = keys.find(id => !NODES[id].ascendancy && NODES[id].type === NODE.SMALL)!, starts = Object.values(CLASS_STARTS);
    const tree = [plain, asc, mastery, ...starts].join(",");
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [], nodes: [], note: "" }]).replace(/(Leveling 1 [^>]*?nodes=")"/, `$1${tree}"`);
    expect(parseBuild(out).leveling![0].nodes).toEqual([plain]);
  });

  it("dos habilidades unidas en un grupo vuelven cada una con sus propios soportes, y la ida y vuelta se estabiliza", () => {
    const herald = gemId("Herald of Ash"), dash = gemId("Flame Dash"), fast = gemId("Faster Attacks Support");
    // Nivel 50: la principal llena el pecho (6) y las otras dos, con un soporte cada una (4 casillas), caen juntas en el casco.
    const stage = { from: 1, to: 50, skill: cleave, supports: [melee, melee, melee, melee, melee], others: [{ skill: herald, supports: [melee] }, { skill: dash, supports: [fast] }], nodes: [], note: "" };
    const once = parseBuild(exportLoadouts(XML, [stage])).leveling!;
    expect(once[0].others).toEqual([{ skill: herald, supports: [melee] }, { skill: dash, supports: [fast] }]);
    const again = parseBuild(exportLoadouts(XML, [{ ...stage, ...once[0], from: 1, nodes: [] }])).leveling!;
    expect(again).toEqual(once);
  });

  it("un tramo sin habilidad principal vuelve sin ella aunque tenga otras habilidades", () => {
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [{ skill: vaal, supports: [] }], nodes: [], note: "" }]);
    expect(parseBuild(out).leveling).toEqual([{ to: 12, skill: null, supports: [], others: [{ skill: vaal, supports: [] }], nodes: [], note: "" }]);
  });

  it("si PoB dejó activo un tramo, el árbol final es el primero que no lo es", () => {
    const d = parse(exportLoadouts(XML, stages).replace('activeSpec="1"', 'activeSpec="2"'));
    expect(parseTree(d).classId).toBe("1");
    expect(parseTree(d).stages).toEqual([]);
  });

  it("si PoB dejó activo el conjunto de habilidades de un tramo, la habilidad principal sigue siendo la del autor", () => {
    const out = exportLoadouts(XML, [{ from: 1, to: 12, skill: null, supports: [], others: [{ skill: vaal, supports: [] }], nodes: [], note: "" }]);
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
