import { describe, expect, it } from "vitest";
import { buildGuide } from "../src/js/guide";
import { build, gemId } from "./helpers";

// Una build de Shadow con Wild Strike (no se consigue hasta el tramo 3): en el primero se sugiere una sustituta, con alternativas.
const wild = gemId("Wild Strike"), shadow = (picks?: Record<number, string>) => buildGuide(build({
  cls: "Shadow", main: { id: wild, supports: [] }, groups: [[wild]],
  stats: { TotalDPS: 46556.8, WithPoisonDPS: 8522001, WithIgniteDPS: 46556.8, WithBleedDPS: 46556.8 },
}), { cls: "Shadow", leagueStart: true, picks });

describe("alternativas a elegir en cada tramo", () => {
  it("la habilidad sustituta viene con hasta tres opciones, de más a menos puntuación, y la primera es la recomendada", () => {
    const st = shadow().skills[0];
    expect(st.own).toBe(false);
    expect(st.options.length).toBe(3);
    expect(st.options[0].id).toBe(st.skill);
    expect(st.recommended).toBe(st.skill);
    const scores = st.options.map(o => o.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("elegir una alternativa cambia la habilidad del tramo, la recomendada sigue siendo la misma y la ruta pide la elegida", () => {
    const base = shadow().skills[0], alt = base.options[1].id;
    const g = shadow({ 0: alt });
    expect(g.skills[0].skill).toBe(alt);
    expect(g.skills[0].recommended).toBe(base.recommended);
    expect(g.skills[0].options.map(o => o.id)).toContain(alt);
    expect(g.plan.got.has(alt)).toBe(true);
  });

  it("una elección que no se puede usar en ese tramo se ignora", () => {
    const base = shadow().skills[0];
    expect(shadow({ 0: "NoExiste" }).skills[0].skill).toBe(base.skill);
    expect(shadow({ 0: wild }).skills[0].skill).toBe(base.skill);
  });

  it("si la habilidad del tramo es la de la build, no hay nada que elegir", () => {
    const { skills } = shadow();
    const own = skills.find(s => s.own)!;
    expect(own.options).toEqual([]);
  });
});
