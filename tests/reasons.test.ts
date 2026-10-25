import { describe, expect, it } from "vitest";
import { reasonOf } from "../src/js/reasons";
import { gemId } from "./helpers";

const wild = gemId("Wild Strike");

describe("reasonOf", () => {
  it("resume con etiquetas y arma qué es una habilidad", () => {
    expect(reasonOf(gemId("Viper Strike"))).toContain("veneno");
    expect(reasonOf(gemId("Cobra Lash"))).toMatch(/solo .*dagas/);
    // Wild Strike vale con muchas armas: no se dice ninguna.
    expect(reasonOf(wild)).not.toContain("solo");
    expect(reasonOf("NoExiste")).toBe("");
  });
});
