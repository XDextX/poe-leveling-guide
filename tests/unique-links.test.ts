import { describe, expect, it } from "vitest";
import { plainUniqueName, tradeUrl, wikiUrl } from "../src/js/unique-links";

describe("plainUniqueName", () => {
  it("quita lo que PoB añade: Foulborn y la semilla de las Timeless Jewels", () => {
    expect(plainUniqueName("Foulborn Mageblood")).toBe("Mageblood");
    expect(plainUniqueName("Brutal Restraint 4948; 34.179; Wind Dancer")).toBe("Brutal Restraint");
    expect(plainUniqueName("Kaom's Heart")).toBe("Kaom's Heart");
  });
});

describe("wikiUrl", () => {
  it("usa guiones bajos y deja el apóstrofo, como la wiki", () => {
    expect(wikiUrl("Kaom's Heart")).toBe("https://www.poewiki.net/wiki/Kaom's_Heart");
    expect(wikiUrl("Foulborn The Taming")).toBe("https://www.poewiki.net/wiki/The_Taming");
  });
});

describe("tradeUrl", () => {
  const parse = (u: string) => { const url = new URL(u); return { path: decodeURIComponent(url.pathname), q: JSON.parse(url.searchParams.get("q")!) }; };

  it("busca el único por nombre y base en la liga dada, entre vendedores conectados", () => {
    const { path, q } = parse(tradeUrl("Standard", "Kaom's Heart", "Glorious Plate"));
    expect(path).toBe("/trade/search/Standard");
    expect(q).toEqual({ query: { name: "Kaom's Heart", type: "Glorious Plate", status: { option: "online" } } });
  });

  it("codifica las ligas con espacios y la semilla de una Timeless Jewel no entra en la búsqueda", () => {
    const { path, q } = parse(tradeUrl("Hardcore Allflame", "Brutal Restraint 4948; 34.179; Wind Dancer", "Timeless Jewel"));
    expect(path).toBe("/trade/search/Hardcore Allflame");
    expect(q.query.name).toBe("Brutal Restraint");
  });
});
