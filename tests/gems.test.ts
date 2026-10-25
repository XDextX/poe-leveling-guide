import { expect, it } from "vitest";
import { skillKind } from "../src/js/gems";
import { gemId } from "./helpers";

it("clasifica las habilidades en supervivencia, daño y comodidad", () => {
  const kind = (name: string) => skillKind(gemId(name));
  expect(["Determination", "Grace", "Steelskin", "Immortal Call", "Molten Shell", "Purity of Fire"].map(kind)).toEqual(Array(6).fill("survival"));
  expect(["Flame Dash", "Frostblink", "Clarity", "Whirling Blades"].map(kind)).toEqual(Array(4).fill("qol"));
  expect(["Cleave", "Herald of Ice", "Hatred", "Frost Blades"].map(kind)).toEqual(Array(4).fill("damage"));
});
