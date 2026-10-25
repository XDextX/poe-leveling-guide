import { expect, it } from "vitest";
import { NODES } from "../src/js/data";
import { NODE } from "../src/js/node-types";
import { newNotables } from "../src/js/stats";

const ids = (type: number, n: number) => Object.keys(NODES).filter(id => NODES[id].type === type && !NODES[id].ascendancy).slice(0, n);
const stage = (nodes: string[]): TreeStage => ({ title: "t", nodes });

it("newNotables da los notables y keystones que el árbol añade al anterior, y no los nodos pequeños", () => {
  const [a, b] = ids(NODE.NOTABLE, 2), [small] = ids(NODE.SMALL, 1);
  expect(newNotables(stage([a, small]), stage([]))).toEqual([NODES[a].name]);
  expect(newNotables(stage([a, b, small]), stage([a]))).toEqual([NODES[b].name]);
  expect(newNotables(stage([a]), stage([a]))).toEqual([]);
  expect(newNotables(stage([a]))).toEqual([NODES[a].name]);
  expect(newNotables(undefined)).toEqual([]);
});
