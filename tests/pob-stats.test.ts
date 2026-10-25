// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { parseStats } from "../src/js/pob/stats";

it("lee las PlayerStat de la build como números y se salta las que no lo son", () => {
  const doc = new DOMParser().parseFromString(
    `<PathOfBuilding><Build><PlayerStat stat="TotalDPS" value="46556.8"/><PlayerStat stat="Life" value="3617"/><PlayerStat stat="Raro" value="abc"/></Build><Other><PlayerStat stat="Ajeno" value="1"/></Other></PathOfBuilding>`, "application/xml");
  expect(parseStats(doc)).toEqual({ TotalDPS: 46556.8, Life: 3617 });
});

it("sin PlayerStat, vacío", () => {
  expect(parseStats(new DOMParser().parseFromString("<PathOfBuilding><Build/></PathOfBuilding>", "application/xml"))).toEqual({});
});
