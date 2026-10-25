// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mentionsLeveling, parseNotes } from "../src/js/pob/notes";

const doc = (inner: string) => new DOMParser().parseFromString(`<PathOfBuilding><Build/>${inner}</PathOfBuilding>`, "application/xml");

describe("parseNotes", () => {
  it("lee el texto de <Notes> sin los códigos de color de PoB y con saltos de línea normales", () => {
    expect(parseNotes(doc("<Notes>\r\n^xE05030Leveling^7: act 1\r\n  usa Frost Blades\n</Notes>"))).toBe("Leveling: act 1\n  usa Frost Blades");
  });

  it("sin notas, vacío; y una <Notes> anidada en otro sitio no cuenta", () => {
    expect(parseNotes(doc(""))).toBe("");
    expect(parseNotes(doc("<Other><Notes>no</Notes></Other>"))).toBe("");
  });
});

describe("mentionsLeveling", () => {
  it("reconoce cuándo el autor habla de subir de nivel", () => {
    for (const t of ["Leveling guide", "mi leveleo", "lvl 12: coge X", "Act 3: ve a la ciudad", "Acto 2", "campaign setup", "campaña"]) expect(mentionsLeveling(t), t).toBe(true);
  });

  it("no se confunde con otras palabras", () => {
    for (const t of ["Use Cleave with Multistrike", "Fracture and reactivity", "Gloves: any"]) expect(mentionsLeveling(t), t).toBe(false);
  });
});
