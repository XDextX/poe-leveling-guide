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
      mods: ["+20 to all Attributes", "Regenerate 2 Life per second", "20% increased Rarity of Items found"], implicits: 1,
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
