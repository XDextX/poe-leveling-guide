// @vitest-environment happy-dom
import { beforeEach, expect, it } from "vitest";
import { buildKey, migrateKeys } from "../src/components/gem/gem";
import { build, gemId } from "./helpers";

const gem = (name: string) => ({ name, id: gemId(name), kind: "normal" as const });
const main = { id: gemId("Heavy Strike"), supports: [] };

beforeEach(() => localStorage.clear());

it("buildKey no cambia al añadir una gema a la build, pero sí con otra clase o ascendencia", () => {
  const a = build({ main, gems: [gem("Heavy Strike")] }), b = build({ main, gems: [gem("Heavy Strike"), gem("Ice Bite Support")] });
  expect(buildKey("Marauder", b)).toBe(buildKey("Marauder", a));
  expect(buildKey("Witch", a)).not.toBe(buildKey("Marauder", a));
  expect(buildKey("Marauder", build({ main, gems: a.gems, ascend: "Juggernaut" }))).not.toBe(buildKey("Marauder", a));
});

it("migrateKeys pasa el avance guardado con las claves antiguas a la actual, sin pisar lo que ya hay ni borrar lo antiguo", () => {
  const b = build({ main, gems: [gem("Heavy Strike"), gem("Ice Bite Support")], ascend: "Juggernaut" });
  const allGems = "poe-gemas:Marauder:Heavy Strike|Ice Bite Support", skillOnly = "poe-gemas:Marauder:" + main.id;
  localStorage.setItem(allGems, '["a"]'); localStorage.setItem(allGems + ":acto", "3");
  localStorage.setItem(skillOnly + ":eleccion", '{"0":"x"}');
  migrateKeys("Marauder", b);
  const now = buildKey("Marauder", b);
  expect(localStorage.getItem(now)).toBe('["a"]');
  expect(localStorage.getItem(now + ":acto")).toBe("3");
  expect(localStorage.getItem(now + ":eleccion")).toBe('{"0":"x"}');
  expect(localStorage.getItem(allGems)).toBe('["a"]');
  localStorage.setItem(now, '["propio"]');
  migrateKeys("Marauder", b);
  expect(localStorage.getItem(now)).toBe('["propio"]');
});
