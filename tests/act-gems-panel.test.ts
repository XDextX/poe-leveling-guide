// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActContent, ActTree, initActGems, setActGems } from "../src/components/act-gems/act-gems-panel";
import { buildGuide } from "../src/js/guide";
import { NODES } from "../src/js/data";
import { build, gemId } from "./helpers";

// El índice avisa de qué sección se lee con un observador de scroll: se sustituye por un oyente que la prueba llama a mano.
let reading: (id: string | null) => void = () => {};
vi.mock("../src/components/toc-nav/toc-nav", () => ({ onCurrentSection: (fn: (id: string | null) => void) => { reading = fn; } }));

describe("panel de gemas del acto", () => {
  // Los componentes son funciones: se llaman sin JSX (este archivo es .ts).
  // Una build con una segunda habilidad (Flame Dash): sale en el montaje sugerido de su tramo como otra habilidad.
  const dash = gemId("Flame Dash");
  const nodes = Object.keys(NODES).filter(id => !NODES[id].ascendancy).slice(0, 60);
  const data = (stages: TreeStage[] = []) => buildGuide(build({
    gems: [{ name: "Cleave", id: gemId("Cleave"), kind: "normal" }, { name: "Flame Dash", id: dash, kind: "normal" }],
    main: { id: gemId("Cleave"), supports: [] }, groups: [[gemId("Cleave")], [dash]],
    tree: { nodes, masteries: [], classId: "1", stages },
  }), { cls: "Marauder", leagueStart: true });
  beforeEach(() => { document.body.innerHTML = ""; });

  it("con el leveling sugerido enseña el montaje del tramo y su árbol, y sin él no", () => {
    const text = (showSuggested: boolean) => ActContent({ data: data(), act: 1, showSuggested })?.textContent ?? "";
    expect(text(true)).toContain("Leveling sugerido");
    expect(text(false)).not.toContain("Leveling sugerido");
    // Sin la casilla el árbol sugerido del tramo no sale; no hace falta lienzo para comprobarlo.
    expect(ActTree({ data: data(), act: 1, showSuggested: false })).toBeNull();
  });

  it("la segunda habilidad no sale en un bloque de montaje con la casilla apagada, y con ella sí (en un acto donde el tramo la sugiere)", () => {
    const act = data().others.flatMap(o => o.stages).find(st => st.skill === dash)?.acts[0];
    expect(act, "el montaje sugerido debe traer Flame Dash en algún acto").toBeDefined();
    const inBlocks = (showSuggested: boolean) => [...(ActContent({ data: data(), act: act!, showSuggested })?.querySelectorAll(".skill-block") ?? [])].some(b => b.textContent?.includes("Flame Dash"));
    expect(inBlocks(true)).toBe(true);
    expect(inBlocks(false)).toBe(false);
  });

  it("al apagar la casilla con un acto a la vista, los paneles se repintan ya y desaparece el árbol sugerido", () => {
    HTMLCanvasElement.prototype.getContext = (() => ({ setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, save() {}, restore() {}, scale() {}, translate() {}, fillText() {}, measureText: () => ({ width: 0 }) })) as never;
    document.body.innerHTML = '<div id="toc"></div><aside id="act-gems" hidden></aside><aside id="act-tree" hidden></aside>';
    initActGems();
    setActGems(data(), true);
    reading("acto-1");
    expect(document.getElementById("act-tree")!.hidden).toBe(false);
    expect(document.getElementById("act-gems")!.textContent).toContain("Leveling sugerido");
    // El jugador apaga la casilla: se llama de nuevo a setActGems y sin cambiar de sección los paneles ya no traen lo sugerido.
    setActGems(data(), false);
    expect(document.getElementById("act-tree")!.hidden).toBe(true);
    expect(document.getElementById("act-gems")!.textContent).not.toContain("Leveling sugerido");
    expect(document.getElementById("act-gems")!.textContent).toContain("Tus habilidades");
  });

  it("con la casilla marcada el árbol del tramo sí sale", () => {
    // El árbol sugerido se dibuja en un lienzo, que este entorno no tiene: se prueba que se pide (no es null) con el lienzo falso.
    HTMLCanvasElement.prototype.getContext = (() => ({ setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, save() {}, restore() {}, scale() {}, translate() {}, fillText() {}, measureText: () => ({ width: 0 }) })) as never;
    expect(ActTree({ data: data(), act: 1, showSuggested: true })).not.toBeNull();
    expect(ActTree({ data: data(), act: 1, showSuggested: false })).toBeNull();
  });

  it("sin el leveling sugerido sigue enseñando las habilidades de la build que ya se tienen en el acto", () => {
    const text = ActContent({ data: data(), act: 1, showSuggested: false })?.textContent ?? "";
    expect(text).toContain("Tus habilidades");
  });
});
