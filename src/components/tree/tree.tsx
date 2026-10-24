/* Árbol de pasivas: stats sumadas, mapa de calor por etapas, puntos indispensables y ascendencia/maestrías. */

import { NODES } from "../../js/data";
import { NODE } from "../../js/node-types";
import { HeatPanel } from "../heat-panel/heat-panel";
import { KeyNodes } from "../key-nodes/key-nodes";
import { Section, Subhead } from "../section/section";
import { TreeExtras } from "../tree-extras/tree-extras";
import { TreeStats } from "../tree-stats/tree-stats";
import "./tree.css";

interface TreeSectionProps {
  tree: BuildTree;
  /** Etapas que se pueden ver en el mapa de calor (de la build o sugeridas). */
  stages: TreeStage[];
  stagesSuggested: boolean;
}

/** Sección del árbol de pasivas. */
export const TreeSection: Component<TreeSectionProps, HTMLDetailsElement> = ({ tree, stages, stagesSuggested }) => {
  const main = tree.nodes.filter(id => !NODES[id].ascendancy);
  const asc = tree.nodes.filter(id => NODES[id].ascendancy && NODES[id].type === NODE.NOTABLE);
  // Keystones primero y luego notables, por nombre: este orden da los números del mapa y de la lista.
  const key = main.filter(id => NODES[id].type === NODE.KEYSTONE || NODES[id].type === NODE.NOTABLE)
    .sort((a, b) => NODES[b].type - NODES[a].type || NODES[a].name.localeCompare(NODES[b].name));
  const extras = <TreeExtras asc={asc} masteries={tree.masteries} />;
  return (
    <Section title="Árbol de pasivas" className="act tree" toc={{ id: "arbol", label: "Árbol de pasivas" }}>
      <Subhead>Stats del árbol</Subhead>
      <TreeStats tree={tree} mainCount={main.length} ascCount={asc.length} />
      <Subhead>Mapa de calor</Subhead>
      <HeatPanel main={main} keyIds={key} stages={stages} stagesSuggested={stagesSuggested} masteries={tree.masteries} />
      <Subhead>Puntos indispensables</Subhead>
      <p class="note">Las keystones y los notables que tiene cogidos la build; el resto son nodos pequeños o de paso.</p>
      <KeyNodes nodes={key} />
      {extras && <><Subhead>Ascendencia y maestrías</Subhead>{extras}</>}
    </Section>
  ) as HTMLDetailsElement;
};
