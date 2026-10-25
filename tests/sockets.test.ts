import { expect, it } from "vitest";
import { fitSockets, maxSockets, socketBudget } from "../src/js/sockets";
import { gemId } from "./helpers";

it("las casillas máximas suben con el nivel del objeto: 4 desde el 25, 5 desde el 35 y 6 desde el 50", () => {
  expect([1, 24, 25, 34, 35, 49, 50, 80].map(maxSockets)).toEqual([3, 3, 4, 4, 5, 5, 6, 6]);
});

it("el equipo da más casillas con el nivel: solo el pecho y las armas a dos manos pasan de 4", () => {
  // pecho + 3 piezas de hasta 4 casillas (casco, guantes, botas) + armas (a dos manos, o dos piezas de una mano con 3 cada una).
  expect([1, 25, 35, 50].map(socketBudget)).toEqual([18, 22, 23, 24]);
});

it("fitSockets reparte las casillas por orden y vacía lo que ya no cabe, anotando qué era", () => {
  const stage = (skill: string): StageSkill => ({ acts: [1, 2], from: 1, to: 10, skill, own: true, supports: [], mainAt: null, links: 6 });
  const [a, b, c, d] = ["Cleave", "Flame Dash", "Determination", "Clarity"].map(gemId).map(stage);
  fitSockets([{ stage: a, size: 3 }, { stage: b, size: 1 }, { stage: c, size: 1 }, { stage: d, size: 1 }], 5);
  expect([a.skill, b.skill, c.skill, d.skill]).toEqual([gemId("Cleave"), gemId("Flame Dash"), gemId("Determination"), null]);
  expect(d.noRoom).toBe(gemId("Clarity"));
  expect(a.noRoom).toBeUndefined();
});
