import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { expect, it } from "vitest";
import { GEMS } from "../src/js/data";
import { gemId } from "./helpers";

// gamedata/gemtext.js lo carga la página solo al pasar el ratón por una gema; aquí se lee igual que ella, en un contexto aislado.
const ctx = vm.createContext({ window: {} as { DATA_TEXT?: Record<string, GemTextRow> } });
vm.runInContext(fs.readFileSync(path.join(import.meta.dirname, "..", "public", "gamedata", "gemtext.js"), "utf8"), ctx);
const text = (ctx.window as { DATA_TEXT: Record<string, GemTextRow> }).DATA_TEXT;

it("hay texto para casi todas las gemas, con la forma que espera la ficha", () => {
  const ids = Object.keys(text);
  expect(ids.length / Object.keys(GEMS).length).toBeGreaterThan(0.85);
  for (const id of ids) {
    const [description, cast, mana, str, dex, int, lines] = text[id];
    expect(typeof description).toBe("string");
    expect([cast, mana, str, dex, int].every(n => Number.isFinite(n))).toBe(true);
    expect(Array.isArray(lines)).toBe(true);
  }
});

it("las fichas dicen lo que hace la gema: descripción, maná, atributos y efectos", () => {
  const [description, cast, mana, , , , lines] = text[gemId("Cleave")];
  expect(description).toContain("swings their weapon");
  expect(cast).toBe(1);
  expect(mana).toBe(7);
  expect(lines.join(" ")).toContain("Dual Wielding");
  const multistrike = text[gemId("Multistrike Support")];
  expect([multistrike[3], multistrike[4]]).toEqual([40, 27]);
  expect(multistrike[0]).toContain("Supports melee attack skills");
});
