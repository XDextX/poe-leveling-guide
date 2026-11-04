// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { exportLoadouts } from "../src/js/pob/leveling";
import { decode, encode, parseBuild } from "../src/js/pob";
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
