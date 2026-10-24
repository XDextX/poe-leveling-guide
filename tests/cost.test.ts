import { describe, expect, it } from "vitest";
import { cost, costTableText, shortCurrency } from "../src/js/cost";

describe("cost", () => {
  it("cambia de moneda justo en los límites de nivel", () => {
    const at = (level: number) => shortCurrency(cost(level));
    expect([1, 7, 8, 15, 16, 27, 28, 37, 38, 90].map(at)).toEqual(
      ["Wisdom", "Wisdom", "Transmutation", "Transmutation", "Alteration", "Alteration", "Chance", "Chance", "Alchemy", "Alchemy"]);
  });

  it("explica la misma tabla en «Fuentes»", () => {
    expect(costTableText()).toBe("menos de 8: Wisdom; 8-15: Transmutation; 16-27: Alteration; 28-37: Chance; 38 o más: Alchemy");
  });
});
