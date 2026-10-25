import { describe, expect, it } from "vitest";
import { placeTip } from "../src/components/float-tip/float-tip";

/** Una ficha falsa de 100 × 50 px: placeTip solo lee su tamaño y escribe left y top. */
const tip = () => ({ offsetWidth: 100, offsetHeight: 50, style: {} as Record<string, string> }) as unknown as HTMLElement & { style: Record<string, string> };

describe("placeTip", () => {
  it("la pone a la derecha y debajo del punto, a una distancia `gap`", () => {
    const t = tip(); placeTip(t, 200, 100, 1000, 800, 10);
    expect([t.style.left, t.style.top]).toEqual(["210px", "110px"]);
  });

  it("la pega al borde derecho si no cabe a la derecha", () => {
    const t = tip(); placeTip(t, 980, 100, 1000, 800, 10);
    expect(t.style.left).toBe("900px");
  });

  it("la sube por encima del punto si no cabe debajo", () => {
    const t = tip(); placeTip(t, 200, 780, 1000, 800, 10);
    expect(t.style.top).toBe("720px");
  });

  it("nunca sale por la izquierda ni por arriba, aunque sea mayor que la caja", () => {
    const t = tip(); placeTip(t, 0, 20, 50, 40, 10);
    expect([t.style.left, t.style.top]).toEqual(["0px", "0px"]);
  });
});
