import { describe, expect, it } from "vitest";
import { parseItemText } from "../src/js/pob/item-text";

/** El texto de un objeto de PoB a partir de sus líneas. */
const item = (...lines: string[]) => lines.join("\n");

describe("parseItemText", () => {
  it("lee un único: nombre, base, nivel, implícitos y mods", () => {
    expect(parseItemText("Helmet", item(
      "Rarity: UNIQUE", "Demigod's Triumph", "Golden Wreath", "LevelReq: 12", "Implicits: 1",
      "+20 to all Attributes", "Regenerate 2 Life per second", "20% increased Rarity of Items found",
    ))).toEqual({
      slot: "Helmet", rarity: "UNIQUE", name: "Demigod's Triumph", base: "Golden Wreath", req: 12,
      mods: ["+20 to all Attributes", "Regenerate 2 Life per second", "20% increased Rarity of Items found"], implicits: 1, variants: [], distinct: [],
    });
  });

  it("separa los implícitos de los demás mods según el número de «Implicits»", () => {
    const text = (n: string) => item("Rarity: RARE", "X", "Y", n, "+1 a", "+2 b", "+3 c");
    expect(parseItemText("Amulet", text("Implicits: 2"))).toMatchObject({ mods: ["+1 a", "+2 b", "+3 c"], implicits: 2 });
    expect(parseItemText("Amulet", text("Implicits:1"))).toMatchObject({ implicits: 1 });
    expect(parseItemText("Amulet", text("Implicits: 0"))).toMatchObject({ implicits: 0, mods: ["+1 a", "+2 b", "+3 c"] });
    // Si el número no se entiende, no hay implícitos en vez de partir mal las líneas.
    expect(parseItemText("Amulet", text("Implicits: muchos"))).toMatchObject({ implicits: 0, mods: ["+1 a", "+2 b", "+3 c"] });
  });

  it("en un objeto mágico o normal, la base es su única línea de nombre", () => {
    expect(parseItemText("Flask 1", item("Rarity: MAGIC", "Seething Divine Life Flask of Staunching", "Implicits: 0")))
      .toMatchObject({ rarity: "MAGIC", name: "Seething Divine Life Flask of Staunching", base: "Seething Divine Life Flask of Staunching" });
  });

  it("sin línea de Implicits no hay mods, aunque haya más texto", () => {
    expect(parseItemText("Ring 1", item("Rarity: RARE", "Doom Loop", "Coral Ring", "+30 to maximum Life")))
      .toMatchObject({ mods: [], implicits: 0, base: "Coral Ring" });
  });

  it("sin LevelReq el nivel requerido es 0", () => {
    expect(parseItemText("Body Armour", item("Rarity: UNIQUE", "Tabula Rasa", "Simple Robe", "Implicits: 0", "Has 6 White Sockets")).req).toBe(0);
  });

  it("calcula el valor de los rangos con la tirada guardada", () => {
    const mods = (range: number) => parseItemText("Helmet", item(
      "Rarity: UNIQUE", "X", "Y", "Implicits: 0", `{range:${range}}+(16-24) to all Attributes`, `{range:${range}}(10-20)% increased Damage`)).mods;
    expect(mods(0)).toEqual(["+16 to all Attributes", "10% increased Damage"]);
    expect(mods(0.5)).toEqual(["+20 to all Attributes", "15% increased Damage"]);
    expect(mods(1)).toEqual(["+24 to all Attributes", "20% increased Damage"]);
  });

  it("deja solo los mods de la variante elegida", () => {
    const mods = (variant: string) => parseItemText("Weapon 1", item(
      "Rarity: UNIQUE", "Kaom's Primacy", "Karui Chopper", `Selected Variant: ${variant}`, "Implicits: 0",
      "{variant:1}(150-200)% increased Physical Damage", "{variant:2,3}(300-400)% increased Physical Damage", "Culling Strike")).mods;
    expect(mods("1")).toEqual(["(150-200)% increased Physical Damage", "Culling Strike"]);
    expect(mods("2")).toEqual(["(300-400)% increased Physical Damage", "Culling Strike"]);
    expect(mods("3")).toEqual(["(300-400)% increased Physical Damage", "Culling Strike"]);
  });

  it("quita las etiquetas de PoB ({crafted}, {tags:…}) y descarta las líneas que se quedan vacías", () => {
    expect(parseItemText("Gloves", item("Rarity: RARE", "X", "Y", "Implicits: 0", "{crafted}+10 to Strength", "{tags:life}+80 to maximum Life", "{crafted}")).mods)
      .toEqual(["+10 to Strength", "+80 to maximum Life"]);
  });

  it("acepta saltos de línea de Windows y líneas en blanco", () => {
    expect(parseItemText("Boots", "Rarity: RARE\r\nGale Tread\r\n\r\nSlink Boots\r\nImplicits: 0\r\n30% increased Movement Speed\r\n"))
      .toMatchObject({ name: "Gale Tread", base: "Slink Boots", mods: ["30% increased Movement Speed"] });
  });
});

// Las reglas de ItemClass:CheckModLineVariant (Item.lua de Path of Building) y el formato que escribe BuildRaw.
describe("variantes de los únicos", () => {
  const mods = (...lines: string[]) => parseItemText("Slot", item("Rarity: UNIQUE", "Test Unique", "Test Base", ...lines)).mods;

  it("cuenta también los mods de la variante alternativa", () => {
    expect(mods(
      "Variant: Uno", "Variant: Dos", "Variant: Tres", "Selected Variant: 1", "Has Alt Variant: true", "Selected Alt Variant: 3",
      "Implicits: 0", "{variant:1}Mod de la 1", "{variant:2}Mod de la 2", "{variant:3}Mod de la 3", "Siempre",
    )).toEqual(["Mod de la 1", "Mod de la 3", "Siempre"]);
  });

  it("admite la variante elegida y varias alternativas a la vez", () => {
    expect(mods(
      "Variant: a", "Variant: b", "Variant: c", "Variant: d", "Selected Variant: 2",
      "Has Alt Variant: true", "Selected Alt Variant: 4", "Has Alt Variant Two: true", "Selected Alt Variant Two: 1",
      "Implicits: 0", "{variant:1}uno", "{variant:2}dos", "{variant:3}tres", "{variant:4}cuatro",
    )).toEqual(["uno", "dos", "cuatro"]);
  });

  it("ignora la alternativa elegida si el objeto no la declara con «Has Alt Variant»", () => {
    expect(mods("Variant: a", "Variant: b", "Selected Variant: 1", "Selected Alt Variant: 2", "Implicits: 0", "{variant:1}uno", "{variant:2}dos"))
      .toEqual(["uno"]);
  });

  it("sin variante elegida usa la última de la lista, como PoB", () => {
    expect(mods("Variant: a", "Variant: b", "Variant: c", "Implicits: 0", "{variant:1}uno", "{variant:3}tres", "Siempre"))
      .toEqual(["tres", "Siempre"]);
    expect(mods("Variant: a", "Variant: b", "Selected Variant: 1", "Has Alt Variant: true", "Implicits: 0", "{variant:1}uno", "{variant:2}dos"))
      .toEqual(["uno", "dos"]);
  });

  it("si el objeto no declara ninguna variante, no descarta ningún mod", () => {
    expect(mods("Implicits: 0", "{variant:1}uno", "{variant:2}dos")).toEqual(["uno", "dos"]);
  });

  describe("con grupos y versiones", () => {
    const grouped = (...lines: string[]) => mods("Version: v1", "Version: v2", "Selected Version: 2", "Variant: a", "Variant: b", "Selected Variant Group: 1=2", "Implicits: 0", ...lines);

    it("deja el mod de la variante elegida en su grupo y de la versión elegida", () => {
      expect(grouped(
        "{variant:1}{group:1}grupo 1 variante a", "{variant:2}{group:1}grupo 1 variante b", "{version:1}solo v1", "{version:2}solo v2", "común",
      )).toEqual(["grupo 1 variante b", "solo v2", "común"]);
    });

    it("descarta los mods con variante pero sin grupo, y los de un grupo sin variante", () => {
      expect(grouped("{variant:2}suelta", "{group:1}sin variante", "{variant:2}{group:9}de otro grupo", "común")).toEqual(["común"]);
    });

    it("sin «Selected Version» descarta los mods que piden una versión", () => {
      expect(mods("Variant: a", "Selected Variant Group: 1=1", "Implicits: 0", "{version:1}pide versión", "{variant:1}{group:1}en su grupo", "común"))
        .toEqual(["en su grupo", "común"]);
    });

    it("un mod puede valer para varios grupos", () => {
      expect(grouped("{variant:2}{group:1,2}en dos grupos")).toEqual(["en dos grupos"]);
    });
  });
});

describe("variantes elegidas", () => {
  const variants = (...lines: string[]) => parseItemText("Boots", item("Rarity: UNIQUE", "Ralakesh's Impatience", "Riveted Boots", ...lines)).variants;

  it("da la etiqueta de la variante que eligió el autor, y las de las alternativas", () => {
    expect(variants("Variant: Pre 3.19.0", "Variant: Endurance Current", "Variant: Frenzy Current", "Selected Variant: 3", "Implicits: 0")).toEqual(["Frenzy Current"]);
    expect(variants("Variant: a", "Variant: b", "Variant: c", "Selected Variant: 1", "Has Alt Variant: true", "Selected Alt Variant: 3", "Implicits: 0")).toEqual(["a", "c"]);
  });

  it("sin variantes declaradas, ninguna; y sin elegir, la última, como PoB", () => {
    expect(variants("Implicits: 0")).toEqual([]);
    expect(variants("Variant: a", "Variant: b", "Implicits: 0")).toEqual(["b"]);
  });
});

describe("mods que distinguen la variante", () => {
  const distinct = (...lines: string[]) => parseItemText("Boots", item("Rarity: UNIQUE", "Ralakesh's Impatience", "Riveted Boots", ...lines)).distinct;
  const header = ["Variant: Pre 3.19.0", "Variant: Endurance Current", "Variant: Frenzy Current", "Selected Variant: 3", "Implicits: 0"];

  it("son los que valen para algunas variantes, entre ellas la elegida, y no los que valen para todas", () => {
    expect(distinct(...header, "{variant:1,2,3}Común a todas", "{variant:3}+1 to Maximum Frenzy Charges", "{variant:2,3}Lo de las dos actuales", "{variant:1}Solo la vieja", "Sin etiqueta")).toEqual(["+1 to Maximum Frenzy Charges", "Lo de las dos actuales"]);
  });

  it("primero los más exclusivos (los de menos variantes), que son los que mejor la distinguen", () => {
    expect(distinct(...header, "{variant:2,3}De dos", "{variant:3}De una")).toEqual(["De una", "De dos"]);
  });

  it("sin variantes, ninguno", () => {
    expect(distinct("Implicits: 0", "+10 to Strength")).toEqual([]);
  });
});

