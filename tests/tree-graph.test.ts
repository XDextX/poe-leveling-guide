import { describe, expect, it } from "vitest";
import { CLASS_STARTS, NODES } from "../src/js/data";
import { NODE } from "../src/js/node-types";
import { ADJ, connectingPaths, pathTo, pickable, stayConnected, toggleNode } from "../src/js/tree-graph";

const CLASS = "1", START = CLASS_STARTS[CLASS];
/** Los nodos de una cadena que sale del inicio de la clase: cada uno vecino del anterior (sin maestrías ni ascendencia). */
function chain(length: number): string[] {
  const line: string[] = [], seen = new Set([START]);
  let cur = START;
  while (line.length < length) {
    const next = (ADJ.get(cur) ?? []).find(id => !seen.has(id) && !NODES[id].ascendancy && NODES[id].type !== NODE.MASTERY);
    if (!next) throw new Error("no hay una cadena tan larga");
    line.push(next); seen.add(next); cur = next;
  }
  return line;
}

describe("pathTo", () => {
  it("da los nodos que faltan, del más cercano a lo cogido hasta el destino", () => {
    const line = chain(4);
    expect(pathTo([], START, line[3])).toEqual(line);
    expect(pathTo([line[0], line[1]], START, line[3])).toEqual([line[2], line[3]]);
  });

  it("vacío si el nodo ya está cogido o es el inicio; null si no hay camino", () => {
    const line = chain(2);
    expect(pathTo(line, START, line[1])).toEqual([]);
    expect(pathTo([], START, START)).toEqual([]);
    expect(pathTo([], START, "no-existe")).toBeNull();
  });

  it("no pasa por la ascendencia", () => {
    const asc = Object.keys(NODES).find(id => NODES[id].ascendancy)!;
    expect(pathTo([], START, asc)).toBeNull();
  });
});

describe("toggleNode", () => {
  it("coger un nodo lejano coge también el camino más corto, y pulsarlo otra vez lo quita con lo que cuelga de él", () => {
    const line = chain(4);
    const taken = toggleNode([], CLASS, line[3]);
    expect(taken).toEqual(line);
    // Quitar el segundo deja solo el primero: los dos que colgaban de él se quedan sin conexión.
    expect(toggleNode(taken, CLASS, line[1])).toEqual([line[0]]);
    // Quitar el último solo quita el último.
    expect(toggleNode(taken, CLASS, line[3])).toEqual(line.slice(0, 3));
  });

  it("no cambia nada con el inicio, una maestría, un nodo de ascendencia o un id que no existe", () => {
    const mastery = Object.keys(NODES).find(id => NODES[id].type === NODE.MASTERY && !NODES[id].ascendancy)!;
    const asc = Object.keys(NODES).find(id => NODES[id].ascendancy)!;
    const base = chain(1);
    for (const id of [START, mastery, asc, "no-existe", "constructor"]) expect(toggleNode(base, CLASS, id), id).toBe(base);
    expect(pickable(mastery, CLASS)).toBe(false);
    expect(pickable(chain(1)[0], CLASS)).toBe(true);
  });

  it("con una clase desconocida no cambia nada", () => {
    const base: string[] = [];
    expect(toggleNode(base, "99", chain(1)[0])).toBe(base);
  });
});

describe("stayConnected", () => {
  it("quita lo que no llega al inicio pasando por los nodos dados, y conserva el orden", () => {
    const line = chain(3);
    expect(stayConnected([line[2], line[0], line[1]], START)).toEqual([line[2], line[0], line[1]]);
    expect(stayConnected([line[2], line[0]], START)).toEqual([line[0]]);
  });
});

describe("los inicios de las demás clases", () => {
  const foreign = Object.values(CLASS_STARTS).filter(id => id !== START);

  /** El camino más corto como lo hacía antes: dejando pasar por los inicios ajenos. */
  function legacyPath(target: string): string[] | null {
    const parent = new Map<string, string>(), queue = [START], seen = new Set([START]);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of ADJ.get(cur) ?? []) {
        if (seen.has(nb) || NODES[nb].ascendancy) continue;
        seen.add(nb); parent.set(nb, cur);
        if (nb === target) { const path: string[] = []; for (let c = target; c !== START; c = parent.get(c)!) path.push(c); return path.reverse(); }
        queue.push(nb);
      }
    }
    return null;
  }

  it("ningún camino cruza el inicio de otra clase, y esos inicios no se pueden pulsar", () => {
    const crossing = Object.keys(NODES).filter(id => pickable(id, CLASS)).find(id => legacyPath(id)?.some(n => foreign.includes(n)));
    expect(crossing, "debe haber un nodo cuyo camino antes cruzaba un inicio ajeno").toBeDefined();
    const path = pathTo([], START, crossing!);
    expect(path === null || !path.some(n => foreign.includes(n))).toBe(true);
    for (const id of foreign) { expect(pickable(id, CLASS), id).toBe(false); expect(toggleNode([], CLASS, id), id).toEqual([]); }
  });
});

describe("connectingPaths", () => {
  it("devuelve los nodos del camino que une los destinos con el inicio, solo con los de la lista", () => {
    const line = chain(4);
    expect([...connectingPaths(line, START, [line[2]])].sort()).toEqual([line[0], line[1], line[2]].sort());
    expect([...connectingPaths([line[0], line[2]], START, [line[2]])]).toEqual([]);
  });
});
