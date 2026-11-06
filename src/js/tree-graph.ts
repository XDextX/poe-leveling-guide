/* El grafo del árbol de pasivas: vecinos de cada nodo, caminos más cortos y qué queda conectado al quitar un nodo. Sin interfaz. */

import { CLASS_STARTS, EDGES, NODES } from "./data";
import { NODE } from "./node-types";

/** Vecinos de cada nodo del árbol, en los dos sentidos. */
export const ADJ = new Map<string, string[]>();
for (let i = 0; i < EDGES.length; i += 2) {
  const a = String(EDGES[i]), b = String(EDGES[i + 1]);
  ADJ.has(a) || ADJ.set(a, []); ADJ.has(b) || ADJ.set(b, []);
  ADJ.get(a)!.push(b); ADJ.get(b)!.push(a);
}

/** Por dónde se puede pasar al coger nodos: los del árbol base, sin ascendencia ni los inicios de las demás clases (el propio se usa solo como punto de partida). */
const walkable = (id: string): boolean => Object.hasOwn(NODES, id) && !NODES[id].ascendancy && NODES[id].type !== NODE.START;
/** Los que se pueden coger o quitar con un clic: no las maestrías (piden elegir un efecto), la ascendencia ni el inicio de la clase. */
export const pickable = (id: string, classId: string): boolean => walkable(id) && NODES[id].type !== NODE.MASTERY && id !== CLASS_STARTS[classId];

/**
 * El camino más corto desde lo ya cogido (o el inicio de la clase) hasta `target`: los nodos que faltan, del más cercano a lo cogido
 * hasta `target`. Vacío si ya está cogido; null si no hay camino.
 */
export function pathTo(taken: Iterable<string>, start: string, target: string): string[] | null {
  const have = new Set([...taken, start]);
  if (have.has(target)) return [];
  const parent = new Map<string, string>(), queue = [...have], seen = new Set(have);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of ADJ.get(cur) ?? []) {
      if (seen.has(nb) || !walkable(nb)) continue;
      seen.add(nb); parent.set(nb, cur);
      if (nb === target) {
        const path: string[] = [];
        for (let c = target; !have.has(c); c = parent.get(c)!) path.push(c);
        return path.reverse();
      }
      queue.push(nb);
    }
  }
  return null;
}

/** Los nodos que siguen conectados al inicio de la clase pasando solo por nodos de `nodes`, en el mismo orden. */
export function stayConnected(nodes: string[], start: string): string[] {
  const set = new Set(nodes), reach = new Set([start]), queue = [start];
  while (queue.length) for (const nb of ADJ.get(queue.shift()!) ?? []) if (set.has(nb) && !reach.has(nb)) { reach.add(nb); queue.push(nb); }
  return nodes.filter(id => reach.has(id));
}

/** Los nodos de `nodes` que hay que conservar para que `targets` sigan conectados al inicio: ellos y los del camino que los une (en `nodes`). */
export function connectingPaths(nodes: string[], start: string, targets: string[]): Set<string> {
  const set = new Set(nodes), parent = new Map<string, string>(), queue = [start], seen = new Set([start]), keep = new Set<string>();
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of ADJ.get(cur) ?? []) if (set.has(nb) && !seen.has(nb)) { seen.add(nb); parent.set(nb, cur); queue.push(nb); }
  }
  for (const t of targets) for (let c: string | undefined = t; c && c !== start && parent.has(c); c = parent.get(c)) keep.add(c);
  return keep;
}

/**
 * Pulsar un nodo del árbol, como en Path of Building: si no está cogido se coge con el camino más corto desde lo ya cogido; si lo está,
 * se quita él y lo que se quede sin conexión con el inicio. Los nodos que no se pueden pulsar (ver pickable) no cambian nada.
 */
export function toggleNode(nodes: string[], classId: string, id: string): string[] {
  const start = CLASS_STARTS[classId];
  if (!start || !pickable(id, classId)) return nodes;
  if (nodes.includes(id)) return stayConnected(nodes.filter(n => n !== id), start);
  const path = pathTo(nodes, start, id);
  return path ? [...nodes, ...path] : nodes;
}
