import { expect, it } from "vitest";
import { assignSlots, fitSockets, maxSockets, slotName, socketBudget } from "../src/js/sockets";
import { gemId } from "./helpers";

it("las casillas máximas suben con el nivel del objeto: 4 desde el 25, 5 desde el 35 y 6 desde el 50", () => {
  expect([1, 24, 25, 34, 35, 49, 50, 80].map(maxSockets)).toEqual([3, 3, 4, 4, 5, 5, 6, 6]);
});

it("el equipo da más casillas con el nivel: solo el pecho y las armas a dos manos pasan de 4", () => {
  // pecho + 3 piezas de hasta 4 casillas (casco, guantes, botas) + armas (a dos manos, o dos piezas de una mano con 3 cada una).
  expect([1, 25, 35, 50].map(socketBudget)).toEqual([18, 22, 23, 24]);
});

it("fitSockets reparte las casillas por orden y vacía lo que ya no cabe, anotando qué era", () => {
  const stage = (skill: string): StageSkill => ({ acts: [1, 2], from: 1, to: 10, skill, own: true, supports: [], mainAt: null, links: 6, options: [], recommended: null });
  const [a, b, c, d] = ["Cleave", "Flame Dash", "Determination", "Clarity"].map(gemId).map(stage);
  fitSockets([{ stage: a, size: 3 }, { stage: b, size: 1 }, { stage: c, size: 1 }, { stage: d, size: 1 }], 5);
  expect([a.skill, b.skill, c.skill, d.skill]).toEqual([gemId("Cleave"), gemId("Flame Dash"), gemId("Determination"), null]);
  expect(d.noRoom).toBe(gemId("Clarity"));
  expect(a.noRoom).toBeUndefined();
});

it("assignSlots pone la habilidad principal en el pecho y reparte los demás grupos por las piezas donde caben", () => {
  // Con objetos de nivel 50 el pecho da 6 y casco, guantes y botas 4: la principal de 6 al pecho, un grupo de 4 al casco, uno de 4 a los guantes.
  expect(assignSlots([6, 4, 4, 1], 50)).toEqual(["Body Armour", "Helmet", "Gloves", "Boots"]);
  // La principal, aunque sea pequeña, elige primero el pecho; un grupo grande no se lo quita.
  expect(assignSlots([2, 6], 50)).toEqual(["Body Armour", null]);
});

it("assignSlots: las armas dan 3 enlaces como máximo, aunque el pecho dé más", () => {
  // Nivel 50: pecho 6, casco, guantes y botas 4, armas 3. El séptimo grupo, de 4, no cabe en una arma.
  expect(assignSlots([6, 4, 4, 4, 3, 3, 4], 50)).toEqual(["Body Armour", "Helmet", "Gloves", "Boots", "Weapon 1", "Weapon 2", null]);
});

it("assignSlots deja sin pieza lo que no cabe y no cuenta los grupos vacíos", () => {
  // Nivel 1: pecho 3, casco, guantes y botas 3, y dos armas de 3. Un grupo de 4 no cabe en ninguna.
  expect(assignSlots([4, 3], 1)).toEqual([null, "Body Armour"]);
  expect(assignSlots([0, 1], 1)).toEqual([null, "Body Armour"]);
  expect(assignSlots([3, 3, 3, 3, 3, 3, 3], 1)).toEqual(["Body Armour", "Helmet", "Gloves", "Boots", "Weapon 1", "Weapon 2", null]);
});

it("slotName traduce las piezas de PoB", () => {
  expect([slotName("Body Armour"), slotName("Weapon 2"), slotName("Otra")]).toEqual(["Pecho", "Arma 2", "Otra"]);
});
