import { describe, expect, it } from "vitest";
import { decodeGameData } from "../src/js/decode";
import { NODE } from "../src/js/node-types";

describe("decodeGameData", () => {
  it("da a cada gema y cada nodo sus campos con nombre", () => {
    const data = decodeGameData(window.DATA as GameDataRaw);
    const gem = Object.values(data.GEMS).find(g => g.name === "Fireball")!;
    expect(gem).toMatchObject({ attr: "i", level: 1 });
    const keystones = Object.values(data.NODES).filter(n => n.type === NODE.KEYSTONE && !n.ascendancy);
    expect(keystones.length).toBeGreaterThan(20);
    expect(keystones.every(n => n.name && Array.isArray(n.stats))).toBe(true);
  });
});
