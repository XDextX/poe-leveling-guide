import { expect, it } from "vitest";
import { uniqueIcon } from "../src/components/item-icon/item-icon";

it("las Timeless Jewels con semilla en el nombre usan el icono de la joya", () => {
  const url = uniqueIcon("Brutal Restraint");
  expect(url).toContain("MarakethCivilization");
  expect(uniqueIcon("Brutal Restraint 4948; 34.179; Wind Dancer")).toBe(url);
  expect(uniqueIcon("Foulborn Brutal Restraint")).toBe(url);
});
