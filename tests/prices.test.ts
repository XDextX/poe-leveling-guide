import { describe, expect, it } from "vitest";
import { ago, categoriesOf, currentLeague, formatPrice, priceFor, reducePrices } from "../src/js/prices";
import type { WatchRow } from "../src/js/prices";

const row = (name: string, mean: number, extra: Partial<WatchRow> = {}): WatchRow => ({ name, mean, min: mean / 2, max: mean * 2, daily: 10, divine: mean / 200, ...extra });

describe("reducePrices", () => {
  it("guarda el precio por nombre exacto (variantes incluidas) y se salta los objetos con enlaces", () => {
    const p = reducePrices([row("Kaom's Heart", 100), row("Kaom's Heart", 900, { linkCount: 6 }), row("Mageblood (X)", 9)]);
    expect(Object.keys(p)).toEqual(["Kaom's Heart", "Mageblood (X)"]);
    expect(p["Kaom's Heart"].mean).toBe(100);
  });
});

describe("formatPrice", () => {
  const price = (mean: number, divine: number, low = false) => ({ mean, min: 0, max: 0, daily: 0, divine, low });
  it("caos con un decimal si es poco, entero si es más; divinos desde uno; ? con pocos datos", () => {
    expect(formatPrice(price(3.26, 0.01))).toBe("≈ 3,3 c");
    expect(formatPrice(price(30, 0.15))).toBe("≈ 30 c");
    expect(formatPrice(price(500, 2.5))).toBe("≈ 2,5 div");
    expect(formatPrice(price(30, 0.15, true))).toBe("≈ 30 c ?");
  });
});

describe("categoriesOf", () => {
  it("pide la categoría de cada hueco, y las armas también la armadura (por los escudos)", () => {
    expect(categoriesOf(["Helmet", "Boots", "Ring 1", "Amulet"]).sort()).toEqual(["accessory", "armour"]);
    expect(categoriesOf(["Weapon 1"]).sort()).toEqual(["armour", "weapon"]);
    expect(categoriesOf(["Flask 2", "Jewel", "Abyssal Jewel"]).sort()).toEqual(["flask", "jewel"]);
    expect(categoriesOf([])).toEqual([]);
  });
});

describe("currentLeague", () => {
  const league = (name: string, start: string) => ({ name, start });
  it("elige la liga de temporada más reciente en softcore, no la extrema, la Ruthless ni la permanente", () => {
    const all = [
      league("Hardcore Allflame", "2026-07-24T20:00:00Z"), league("Standard", "2013-01-23T21:00:00Z"), league("Allflame", "2026-07-24T20:00:00Z"),
      league("Ruthless Allflame", "2026-07-24T20:00:00Z"), league("HC Ruthless Allflame", "2026-07-24T20:00:00Z"), league("Solo Self-Found", "2013-01-23T21:00:00Z"),
      league("Vieja", "2026-03-01T20:00:00Z"),
    ];
    expect(currentLeague(all)).toBe("Allflame");
  });

  it("sin ninguna de temporada, Standard", () => {
    expect(currentLeague([])).toBe("Standard");
    expect(currentLeague([{ name: "Hardcore", start: "2013-01-23T21:00:00Z" }])).toBe("Standard");
  });
});

describe("ago", () => {
  it("dice hace cuánto fue: menos de un minuto, minutos u horas", () => {
    const now = 10_000_000;
    expect(ago(now - 20_000, now)).toBe("hace menos de 1 min");
    expect(ago(now - 12 * 60_000, now)).toBe("hace 12 min");
    expect(ago(now - 185 * 60_000, now)).toBe("hace 3 h");
  });
});

describe("priceFor", () => {
  // Las botas de una build real: poe.watch separa las tres variantes con sus propias etiquetas; PoB las llama "… Current".
  const boots = reducePrices([row("Ralakesh's Impatience (Power Charges)", 480), row("Ralakesh's Impatience (Frenzy Charges)", 290), row("Ralakesh's Impatience (Endurance Charges)", 300)]);

  it("elige la variante cuya etiqueta comparte palabras con la que eligió la build", () => {
    const m = priceFor(boots, { name: "Ralakesh's Impatience", variants: ["Power Current"] })!;
    expect([m.price.mean, m.how, m.label]).toEqual([480, "variant", "Power Charges"]);
    expect(priceFor(boots, { name: "Ralakesh's Impatience", variants: ["Frenzy Current"] })!.price.mean).toBe(290);
  });

  it("sin variante elegida, sin coincidencia o con empate, toma la más barata y lo dice", () => {
    for (const variants of [[], ["Pre 3.19.0"], ["Charges Current"]]) {
      const m = priceFor(boots, { name: "Ralakesh's Impatience", variants })!;
      expect([m.price.mean, m.how, m.options]).toEqual([290, "cheapest", 3]);
    }
  });

  it("un único sin variantes, o con precio propio además de variantes, no es 'la más barata'", () => {
    const p = reducePrices([row("Mageblood", 500), row("Mageblood (X)", 9), row("Sin variantes", 40)]);
    expect(priceFor(p, { name: "Sin variantes" })!.how).toBe("single");
    expect(priceFor(p, { name: "Mageblood", variants: ["Nada que ver"] })!.price.mean).toBe(500);
    expect(priceFor(p, { name: "No existe" })).toBeNull();
  });

  it("encuentra el único aunque PoB le ponga Foulborn o la semilla", () => {
    expect(priceFor(reducePrices([row("Brutal Restraint", 3)]), { name: "Brutal Restraint 4948; 34.179; Wind Dancer" })!.price.mean).toBe(3);
  });
});
