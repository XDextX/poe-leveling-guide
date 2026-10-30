import { describe, expect, it } from "vitest";
import { serviceWorker } from "../scripts/lib/sw.mts";

describe("serviceWorker", () => {
  const code = serviceWorker("v1", ["./", "gamedata/gems.js"]);

  it("es JavaScript válido con el nombre de caché y los archivos", () => {
    expect(() => new Function(code)).not.toThrow();
    expect(code).toContain('"poe-gemas-v1"');
    expect(code).toContain('["./","gamedata/gems.js"]');
  });
});
