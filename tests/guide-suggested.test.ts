// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { BuildForm } from "../src/components/build-form/build-form";
import { Guide } from "../src/components/guide/guide";
import { buildGuide } from "../src/js/guide";
import { NODES } from "../src/js/data";
import { build, gemId } from "./helpers";

describe("Leveling sugerido opcional", () => {
  // Los componentes son funciones: se llaman sin JSX (este archivo es .ts).
  const data = () => buildGuide(build({ gems: [{ name: "Cleave", id: gemId("Cleave"), kind: "normal" }], main: { id: gemId("Cleave"), supports: [] } }), { cls: "Marauder", leagueStart: true });
  const guide = (showSuggested: boolean) => Guide({ data: data(), showZones: false, showSuggested });

  // "Mi avance" pinta su resumen en elementos de la página (el panel de la derecha y su botón).
  beforeEach(() => { document.body.innerHTML = '<div id="progress-mini"></div><button id="progress-toggle"></button>'; });

  it("la casilla del formulario empieza sin marcar", () => {
    const form = BuildForm({ classes: ["Marauder"] });
    const box = form.querySelector<HTMLInputElement>("#suggested")!;
    expect(box).not.toBeNull();
    expect(box.checked).toBe(false);
  });

  it("sin la casilla la guía no trae la sección ni su entrada del índice, y con ella sí", () => {
    expect(guide(false).querySelector("#leveling")).toBeNull();
    expect(guide(true).querySelector("#leveling")).not.toBeNull();
  });

  it("sin la casilla el árbol no ofrece las etapas sugeridas por la app, y con ella sí; los árboles propios de la build siempre", () => {
    const nodes = Object.keys(NODES).filter(id => !NODES[id].ascendancy).slice(0, 60);
    const mine = (stages: TreeStage[] = []) => buildGuide(build({ gems: [{ name: "Cleave", id: gemId("Cleave"), kind: "normal" }], main: { id: gemId("Cleave"), supports: [] }, tree: { nodes, masteries: [], classId: "1", stages } }), { cls: "Marauder", leagueStart: true });
    const stagesOf = (data: ReturnType<typeof mine>, showSuggested: boolean) => Guide({ data, showZones: false, showSuggested }).querySelector(".stages");
    expect(stagesOf(mine(), false)).toBeNull();
    expect(stagesOf(mine(), true)).not.toBeNull();
    const own = mine([{ title: "Acto 3", nodes: nodes.slice(0, 10) }]);
    expect(stagesOf(own, false)).not.toBeNull();
  });

  it("«Mi leveling» sale igual con o sin la sección sugerida", () => {
    const mine = (show: boolean) => Guide({
      data: data(), showZones: false, showSuggested: show,
      leveling: { imported: false, onSave: () => {}, onExport: async () => "" },
    }).querySelector("#my-leveling");
    expect(mine(false)).not.toBeNull();
    expect(mine(true)).not.toBeNull();
  });
});
