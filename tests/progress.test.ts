import { expect, it } from "vitest";
import { plan as makePlan } from "../src/js/plan";
import { pendingGems, progressByAct } from "../src/js/progress";
import { build, gemId } from "./helpers";

const plan = (): Plan => ({
  out: [], missing: [], start: ["a"],
  got: new Map([["a", { act: 1, quest: "Inicio" }], ["b", { act: 1, quest: "Q1" }], ["c", { act: 2, quest: "Q2" }], ["d", { act: 2, quest: "Q2" }], ["e", { act: 3, quest: "Q3" }]]),
});

it("progressByAct cuenta por acto las gemas marcadas, con las del inicio en el acto 1", () => {
  expect(progressByAct(plan(), new Set(["a", "c"]))).toEqual([
    { act: 1, total: 2, done: 1 }, { act: 2, total: 2, done: 1 }, { act: 3, total: 1, done: 0 },
  ]);
});

it("pendingGems da las gemas sin marcar entre dos actos, agrupadas por misión", () => {
  expect(pendingGems(plan(), new Set(["b"]), 1, 2)).toEqual([
    { act: 1, quest: "Inicio", ids: ["a"] }, { act: 2, quest: "Q2", ids: ["c", "d"] },
  ]);
  expect(pendingGems(plan(), new Set(), 3, 3)).toEqual([{ act: 3, quest: "Q3", ids: ["e"] }]);
  expect(pendingGems(plan(), new Set(["a", "b", "c", "d", "e"]), 1, 10)).toEqual([]);
});

it("una gema inicial del plan real cuenta una sola vez", () => {
  const id = gemId("Heavy Strike");
  const p = makePlan(build({ gems: [{ name: "Heavy Strike", id, kind: "normal" }] }), "Marauder", false);
  expect(p.start).toEqual([id]);
  expect(progressByAct(p, new Set([id]))).toEqual([{ act: 1, total: 1, done: 1 }]);
  expect(pendingGems(p, new Set(), 1, 10)).toEqual([{ act: 1, quest: "Inicio", ids: [id] }]);
});
