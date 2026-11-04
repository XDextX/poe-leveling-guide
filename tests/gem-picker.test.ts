// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { focusQuietly, GemPicker } from "../src/components/gem-picker/gem-picker";
import { isActive } from "../src/js/gems";
import { GEMS } from "../src/js/data";
import { gemId } from "./helpers";

const ids = Object.keys(GEMS).filter(isActive).slice(0, 30);
const first = ids.slice().sort((a, b) => GEMS[a].name.localeCompare(GEMS[b].name))[0];
const current = ids[10];

function setup(value: string | null = current, clearOnPick = false) {
  const onPick = vi.fn();
  // Los componentes son funciones: se llaman sin JSX (este archivo es .ts).
  const box = GemPicker({ ids, value, label: "Habilidad", field: "skill", onPick, clearOnPick });
  document.body.replaceChildren(box);
  const input = box.querySelector("input")!, list = box.querySelector("ul")!;
  const key = (k: string) => input.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  return { onPick, box, input, list, key, open: () => !list.hidden, rows: () => [...list.children] as HTMLElement[] };
}

beforeEach(() => { document.body.replaceChildren(); });

describe("GemPicker", () => {
  it("al entrar abre la lista con todas las gemas y la actual como fila activa", () => {
    const { input, list, open, rows } = setup();
    input.dispatchEvent(new FocusEvent("focus"));
    expect(open()).toBe(true);
    expect(rows().length).toBe(ids.length);
    expect(rows().findIndex(r => r.classList.contains("active"))).toBe(rows().findIndex(r => r.dataset.id === current));
    expect(input.getAttribute("aria-activedescendant")).toBe(list.querySelector(".active")!.id);
    expect(list.querySelector(".active")!.getAttribute("aria-selected")).toBe("true");
  });

  it("Enter en un campo recién enfocado no cambia la gema", () => {
    const { input, key, onPick } = setup();
    input.dispatchEvent(new FocusEvent("focus"));
    key("Enter");
    expect(onPick).not.toHaveBeenCalled();
    expect(input.value).toBe(GEMS[current].name);
  });

  it("con el campo vacío ninguna fila está activa hasta usar las flechas", () => {
    const { input, key, onPick, rows } = setup(null, true);
    input.dispatchEvent(new FocusEvent("focus"));
    expect(rows().some(r => r.classList.contains("active"))).toBe(false);
    key("Enter");
    expect(onPick).not.toHaveBeenCalled();
    key("ArrowDown"); key("Enter");
    expect(onPick).toHaveBeenCalledWith(first);
  });

  it("↓ y Enter eligen la fila siguiente a la actual", () => {
    const { input, key, onPick, rows } = setup();
    input.dispatchEvent(new FocusEvent("focus"));
    key("ArrowDown"); key("Enter");
    const at = rows().findIndex(r => r.dataset.id === current);
    expect(onPick).toHaveBeenCalledWith(rows()[at + 1].dataset.id);
  });

  it("pulsar el ratón abre la lista aunque el campo ya tuviera el foco, y Esc la cierra", () => {
    const { input, key, open } = setup();
    expect(open()).toBe(false);
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(open()).toBe(true);
    key("Escape");
    expect(open()).toBe(false);
  });

  it("focusQuietly da el foco sin abrir la lista", () => {
    const { input, open } = setup();
    focusQuietly(() => input.dispatchEvent(new FocusEvent("focus")));
    expect(open()).toBe(false);
    input.dispatchEvent(new FocusEvent("focus"));
    expect(open()).toBe(true);
  });

  it("la lista no se puede enfocar con el teclado: con scroll Chrome la haría enfocable y Tab perdería el foco", () => {
    const { list } = setup();
    expect(list.getAttribute("tabindex")).toBe("-1");
  });

  it("al escribir filtra por lo escrito", () => {
    const { input, rows } = setup();
    input.value = GEMS[current].name.slice(0, 4).toLowerCase();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().every(r => GEMS[r.dataset.id!].name.toLowerCase().includes(input.value))).toBe(true);
  });

  it("no avisa al salir del campo si la gema no cambió, ni si el campo ya no está en la página (el bucle de redibujado)", () => {
    const { input, box, onPick } = setup();
    input.dispatchEvent(new FocusEvent("blur"));
    expect(onPick).not.toHaveBeenCalled();
    input.value = GEMS[ids[3]].name;
    box.remove();
    input.dispatchEvent(new FocusEvent("blur"));
    expect(onPick).not.toHaveBeenCalled();
  });

  it("avisa una sola vez al salir del campo con otra gema escrita, y avisa del nombre que no existe", () => {
    const { input, onPick, box } = setup();
    input.value = GEMS[ids[3]].name;
    input.dispatchEvent(new FocusEvent("blur"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(ids[3]);
    input.value = "Cosa Inventada";
    input.dispatchEvent(new FocusEvent("blur"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(box.querySelector(".field-error")!.textContent).toContain("Cosa Inventada");
  });

  it("canSupport no falla con un soporte sin datos de habilidad", async () => {
    const { canSupport } = await import("../src/js/suggest");
    const noData = Object.keys(GEMS).find(id => !Object.hasOwn((window.DATA as { K: object }).K, id) && GEMS[id].name.endsWith(" Support"));
    expect(noData, "debe haber un soporte sin datos en los datos del juego").toBeDefined();
    expect(canSupport(noData!, gemId("Cleave"))).toBe(true);
  });
});
