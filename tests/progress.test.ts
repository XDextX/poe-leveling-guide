import { expect, it } from "vitest";
import { pendingGems, progressByAct } from "../src/js/progress";

const plan = (): Plan => ({
  out: [], missing: [], start: ["a"],
  got: new Map([["b", { act: 1, quest: "Q1" }], ["c", { act: 2, quest: "Q2" }], ["d", { act: 2, quest: "Q2" }], ["e", { act: 3, quest: "Q3" }]]),
});

it("progressByAct cuenta por acto las gemas marcadas, con las del inicio en el acto 1", () => {
  expect(progressByAct(plan(), new Set(["a", "c"]))).toEqual([
    { act: 1, total: 2, done: 1 }, { act: 2, total: 2, done: 1 }, { act: 3, total: 1, done: 0 },
  ]);
});

it("pendingGems da las gemas sin marcar entre dos actos, agrupadas por misión", () => {
  expect(pendingGems(plan(), new Set(["b"]), 1, 2)).toEqual([
    { act: 1, quest: "Al empezar", ids: ["a"] }, { act: 2, quest: "Q2", ids: ["c", "d"] },
  ]);
  expect(pendingGems(plan(), new Set(), 3, 3)).toEqual([{ act: 3, quest: "Q3", ids: ["e"] }]);
  expect(pendingGems(plan(), new Set(["a", "b", "c", "d", "e"]), 1, 10)).toEqual([]);
});
