import { expect, it } from "vitest";
import { maxSockets } from "../src/js/sockets";

it("las casillas máximas suben con el nivel del objeto: 4 desde el 25, 5 desde el 35 y 6 desde el 50", () => {
  expect([1, 24, 25, 34, 35, 49, 50, 80].map(maxSockets)).toEqual([3, 3, 4, 4, 5, 5, 6, 6]);
});
