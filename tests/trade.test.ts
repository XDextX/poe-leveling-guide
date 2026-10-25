import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { normalizeMod, tradeFilters } from "../src/js/trade";

// gamedata/tradestats.js lo carga la página solo cuando hace falta; aquí se lee igual que ella, en un contexto aislado.
const ctx = vm.createContext({ window: {} as { DATA_TRADE?: Record<string, string> } });
vm.runInContext(fs.readFileSync(path.join(import.meta.dirname, "..", "public", "gamedata", "tradestats.js"), "utf8"), ctx);
const table = (ctx.window as { DATA_TRADE: Record<string, string> }).DATA_TRADE;

describe("normalizeMod", () => {
  it("cambia los números y los rangos de PoB por # y quita el (Local) del comercio", () => {
    expect(normalizeMod("+(50-70) to maximum Life")).toBe("+# to maximum Life");
    expect(normalizeMod("(0.3-0.5)% of Physical Attack Damage Leeched as Life")).toBe("#% of Physical Attack Damage Leeched as Life");
    expect(normalizeMod("Adds (5-8) to 12 Cold Damage")).toBe("Adds # to # Cold Damage");
    expect(normalizeMod("#% increased Armour (Local)")).toBe("#% increased Armour");
  });
});

describe("tabla del comercio", () => {
  it("tiene los mods del juego con su identificador, y encuentra los de PoB aunque lleven rangos", () => {
    expect(Object.keys(table).length).toBeGreaterThan(5000);
    expect(table[normalizeMod("+(1-2) to Maximum Frenzy Charges")]).toBe("explicit.stat_4078695");
    expect(table[normalizeMod("+30 to Maximum Life")] ?? table[normalizeMod("+(30-40) to maximum Life")]).toMatch(/^explicit\.stat_/);
  });
});

describe("tradeFilters", () => {
  it("da los identificadores de las líneas que el comercio conoce, sin repetir y como mucho tres", () => {
    const mods = ["+1 to Maximum Frenzy Charges", "+2 to Maximum Frenzy Charges", "Esta línea no existe en el juego", "+(30-40) to maximum Life", "#% increased Movement Speed per Frenzy Charge"];
    const ids = tradeFilters(mods, table);
    expect(ids[0]).toBe("explicit.stat_4078695");
    expect(ids.length).toBeLessThanOrEqual(3);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tradeFilters(["Nada"], table)).toEqual([]);
    // Un mod con opciones (su identificador lleva "|") no sirve como filtro simple.
    expect(tradeFilters(["a", "b"], { a: "explicit.stat_1|5", b: "explicit.stat_2" })).toEqual(["explicit.stat_2"]);
  });
});
