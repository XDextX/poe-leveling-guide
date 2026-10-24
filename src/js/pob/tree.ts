/* El árbol de pasivas de la build: el activo y, si el autor los incluyó, los demás como etapas. */

import { NODES } from "../data";

/** El <Spec> (árbol) que la build tiene activo y todos los demás. */
export function treeSpecs(doc: Document): { active: Element | undefined; all: Element[] } {
  const specs = [...doc.querySelectorAll("Tree > Spec")];
  const active = specs[(Number(doc.querySelector("Tree")?.getAttribute("activeSpec")) || 1) - 1] || specs[0];
  return { active, all: specs };
}

/**
 * Árbol activo → { nodes, masteries, classId, stages }; los nodos de joyas cluster no están en el árbol base y se ignoran.
 * stages son los demás árboles de la build, si el autor los incluyó (suelen ser los de leveling): [{ title, nodes }].
 */
export function parseTree(doc: Document): BuildTree {
  const { active: spec, all } = treeSpecs(doc);
  if (!spec) return { nodes: [], masteries: [], classId: null, stages: [] };
  const nodesOf = (s: Element) => (s.getAttribute("nodes") || "").split(",").filter(id => NODES[id]);
  const masteries = [...(spec.getAttribute("masteryEffects") || "").matchAll(/\{(\d+),(\d+)\}/g)].map((m): [string, string] => [m[1], m[2]]);
  const stages = all.length > 1 ? all.filter(s => s !== spec).map((s, i) => ({ title: s.getAttribute("title") || `Árbol ${i + 1}`, nodes: nodesOf(s) })) : [];
  return { nodes: nodesOf(spec), masteries, classId: spec.getAttribute("classId"), stages };
}
