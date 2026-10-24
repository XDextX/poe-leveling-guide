import { describe, expect, it } from "vitest";
import { plan } from "../src/js/plan";
import { routeDefs } from "../src/js/route";
import { build, gemId } from "./helpers";

describe("routeDefs", () => {
  it("añade la Biblioteca solo si se pide", () => {
    expect(routeDefs(build(), false).has("LIBRARY")).toBe(false);
    expect(routeDefs(build(), false, { library: true }).has("LIBRARY")).toBe(true);
  });

  it("traduce los bandidos y el inicio de liga", () => {
    expect([...routeDefs(build({ bandit: "None" }), true)]).toEqual(["BANDIT_KILL", "LEAGUE_START"]);
    expect([...routeDefs(build({ bandit: "Alira" }), false)]).toEqual(["BANDIT_ALIRA"]);
  });
});

describe("plan", () => {
  // La misión de la Biblioteca de Siosa (acto 3) solo entra en la ruta si da alguna gema de la build.
  const visitsLibrary = (p: Plan) => p.out.some(s => s.text.includes("A Fixture of Fate"));

  it("sin gemas que conseguir no pasa por la Biblioteca de Siosa", () => {
    expect(visitsLibrary(plan(build(), "Marauder", true))).toBe(false);
  });

  it("pasa por la Biblioteca si allí se consigue alguna gema de la build", () => {
    const gems = ["Arcane Surge Support", "Ice Bite Support", "Cluster Traps Support", "Volley Support"].map(gemId);
    const p = plan(build({ gems: gems.map(id => ({ name: id, id, kind: "normal" })) }), "Marauder", true);
    expect(visitsLibrary(p)).toBe(true);
  });
});
