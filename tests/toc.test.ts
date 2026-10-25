import { describe, expect, it } from "vitest";
import { currentSection, tocRows } from "../src/js/toc";

const t = (id: string, extra: Partial<TocTarget> = {}): TocTarget => ({ id, label: id, ...extra });

describe("tocRows", () => {
  it("un destino suelto es una fila y los de un grupo van juntos en el sitio del primero", () => {
    const rows = tocRows([t("resumen"), t("a1", { group: "Ruta" }), t("equipo"), t("a2", { group: "Ruta" }), t("fuentes")]);
    expect(rows.map(r => [r.group, r.items.map(i => i.id)])).toEqual([[null, ["resumen"]], ["Ruta", ["a1", "a2"]], [null, ["equipo"]], [null, ["fuentes"]]]);
  });

  it("los que tienen padre van anidados bajo él y no son filas aparte", () => {
    const rows = tocRows([t("arbol"), t("mapa", { parent: "arbol" }), t("fuentes")]);
    expect(rows.map(r => r.items[0].id)).toEqual(["arbol", "fuentes"]);
    expect(rows[0].nested.map(n => n.id)).toEqual(["mapa"]);
    expect(rows[1].nested).toEqual([]);
  });

  it("sin destinos, sin filas", () => {
    expect(tocRows([])).toEqual([]);
  });
});

describe("currentSection", () => {
  const at = (...tops: number[]) => tops.map((top, i) => ({ id: "s" + i, top }));
  const view = { line: 100, atBottom: false, viewportHeight: 800 };

  it("es la última sección cuyo inicio ya pasó la línea", () => {
    expect(currentSection(at(-500, -50, 90, 400), view)).toBe("s2");
    expect(currentSection(at(-500, -50, 100, 400), view)).toBe("s2");
  });

  it("antes de llegar a la primera, ninguna", () => {
    expect(currentSection(at(300, 900), view)).toBeNull();
    expect(currentSection([], view)).toBeNull();
  });

  it("al final de la página, la pulsada si sigue a la vista, aunque no llegue a la línea", () => {
    const pinned = { id: "s3", top: 650 };
    expect(currentSection(at(-500, -50, 90, 650), { ...view, atBottom: true, pinned })).toBe("s3");
    // Si la pulsada ya no está a la vista, manda la posición.
    expect(currentSection(at(-500, -50, 90, 900), { ...view, atBottom: true, pinned: { id: "s3", top: 900 } })).toBe("s2");
    // Y lejos del final, la pulsada no cuenta.
    expect(currentSection(at(-500, -50, 90, 650), { ...view, pinned })).toBe("s2");
  });
});
