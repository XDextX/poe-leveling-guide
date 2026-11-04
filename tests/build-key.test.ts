import { expect, it } from "vitest";
import { buildKey } from "../src/components/gem/gem";
import { build, gemId } from "./helpers";

it("buildKey no cambia al añadir una gema a la build", () => {
  const gem = (name: string) => ({ name, id: gemId(name), kind: "normal" as const });
  const main = { id: gemId("Heavy Strike"), supports: [] };
  const a = build({ main, gems: [gem("Heavy Strike")] }), b = build({ main, gems: [gem("Heavy Strike"), gem("Ice Bite Support")] });
  expect(buildKey("Marauder", b)).toBe(buildKey("Marauder", a));
  expect(buildKey("Witch", a)).not.toBe(buildKey("Marauder", a));
});
