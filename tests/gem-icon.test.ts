import { expect, it } from "vitest";
import { GEMS } from "../src/js/data";
import { gemIcon } from "../src/components/item-icon/item-icon";
import { gemId } from "./helpers";

it("las gemas traen la ruta de su arte y se convierte en la URL del CDN", () => {
  expect(gemIcon(GEMS[gemId("Cleave")].icon)).toBe("https://web.poecdn.com/image/Art/2DItems/Gems/Cleave.png?scale=1&w=1&h=1");
  expect(gemIcon("")).toBe("");
  const sin = Object.values(GEMS).filter(g => !g.icon);
  // Si RePoE dejara de dar el arte de muchas gemas, sería un fallo de los datos y no algo normal.
  expect(sin.length / Object.keys(GEMS).length).toBeLessThan(0.1);
});
