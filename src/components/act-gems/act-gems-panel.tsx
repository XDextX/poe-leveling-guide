/*
 * Panel con las gemas del acto que se está leyendo, en el margen derecho de la guía (solo cuando cabe, como el índice a la izquierda).
 * Enseña a la derecha el montaje del tramo si hay "Leveling sugerido" y, de cada habilidad de la build, las gemas que ya se tienen en ese acto; a la izquierda, bajo el índice, el árbol de ese tramo.
 * setActGems le da la guía; initActGems lo engancha al índice, que dice qué sección se está leyendo.
 * Va aparte del marcado (act-gems.tsx) porque usa los datos del juego, que la página prerenderizada (en Node) no puede cargar.
 */

import { NODES } from "../../js/data";
import { isActive, SKILL_KINDS, skillKind } from "../../js/gems";
import type { GuideData } from "../../js/guide";
import { Gem } from "../gem/gem";
import { ToggleGroup } from "../toggle-group/toggle-group";
import { heatControls } from "../heat-controls/heat-controls";
import { drawHeat } from "../heatmap/heatmap";
import { StageSkills } from "../stage-lines/stage-lines";
import { onCurrentSection } from "../toc-nav/toc-nav";

const panel = () => document.getElementById("act-gems")!, treePanel = () => document.getElementById("act-tree")!;

let guide: GuideData | null = null, shownAct = 0;

interface ActContentProps { data: GuideData; act: number }

/** Lo que va en el panel de un acto, o null si no hay nada que enseñar. */
const ActContent: Component<ActContentProps, DocumentFragment | null> = ({ data, act }) => {
  const inAct = (st: StageSkill) => st.acts[0] <= act && act <= st.acts[1];
  const stage = data.skills.find(inAct), mainId = data.build.main?.id;
  const others = data.others.flatMap(other => { const st = other.stages.find(inAct); return st ? [{ other, stage: st }] : []; });
  // De cada habilidad de la build, las gemas que ya se tienen al llegar a este acto: las del inicio y las que da la ruta hasta aquí.
  const has = (id: string) => data.plan.start.includes(id) || (data.plan.got.get(id)?.act ?? Infinity) <= act;
  const firstActive = (ids: string[]) => ids.find(isActive);
  const rank = (ids: string[]) => { const id = firstActive(ids); return id ? SKILL_KINDS.indexOf(skillKind(id)) : SKILL_KINDS.length; };
  // Por orden de importancia: supervivencia, daño y comodidad (a igualdad, el de la build).
  const groups = data.build.groups.map(ids => ids.filter(has)).filter(ids => ids.length > 0).sort((a, b) => rank(a) - rank(b));
  if (!stage && !others.length && !groups.length) return null;
  return (
    <>
      <b class="act-gems-title">Acto {act}</b>
      {(stage || others.length > 0) && (
        <>
          <span class="act-gems-sub">Leveling sugerido</span>
          <StageSkills main={stage && mainId ? { skillId: mainId, stage } : null} others={others} />
        </>
      )}
      {groups.length > 0 && <span class="act-gems-sub">Tus habilidades</span>}
      {groups.map(ids => <div class="act-gems-group">{ids.map(id => <Gem id={id} />)}</div>)}
    </>
  ) as DocumentFragment;
};

/** Repinta el árbol que se está viendo en el panel (null si no hay). */
let redrawTree: (() => void) | null = null;

/** El árbol del tramo de un acto, para el margen izquierdo, o null si no hay (solo hay uno por tramo cuando es sugerido). Es el mismo mapa de calor de la sección del árbol, con sus gestos y fichas, encuadrado en los nodos del tramo. */
const ActTree: Component<ActContentProps, DocumentFragment | null> = ({ data, act }) => {
  const at = data.skills.findIndex(s => s.acts[0] <= act && act <= s.acts[1]), tree = data.levelingTrees[at];
  if (!tree) { redrawTree = null; return null; }
  const nodes = tree.nodes.filter(id => !NODES[id].ascendancy);
  const canvas = <canvas class="heat" role="img" aria-label="Árbol de pasivas de este tramo" /> as HTMLCanvasElement;
  // El calor es opcional: empieza apagado, con solo los nodos del tramo, y se enciende con la botonera.
  let mode = "none";
  const content = (
    <>
      <span class="act-gems-sub">Árbol · ≈{tree.points} puntos</span>
      <ToggleGroup className="heat-toggle" label="Calor del árbol" options={[["none", "Sin calor"], ["both", "Con calor"]]} onPick={v => { mode = v; redrawTree?.(); }} />
      <div class="heat-wrap">{canvas}</div>
      <span class="act-gems-note">Arrastra para mover, Ctrl+rueda o pellizca para zoom; pasa el ratón o toca un nodo para ver qué hace.</span>
    </>
  ) as DocumentFragment;
  // Se pinta al mostrarse el panel (update), cuando ya mide lo que mide.
  redrawTree = () => drawHeat(canvas, nodes, [], mode, nodes);
  heatControls(canvas, redrawTree, data.build.tree.masteries);
  return content;
};

/** Cambia la guía de la que sale el panel (null sin guía). */
export function setActGems(data: GuideData | null): void {
  guide = data;
  shownAct = 0;
  if (!data) panel().hidden = treePanel().hidden = true;
}

/** Coloca el árbol justo bajo el índice, que mide lo que le toque según sus enlaces; el resto de la altura es su máximo. */
function placeTree(): void {
  const top = Math.round(document.getElementById("toc")!.getBoundingClientRect().bottom) + 16;
  treePanel().style.top = top + "px";
  treePanel().style.maxHeight = `calc(100vh - ${top + 32}px)`;
}

/** Lo que se está leyendo: si es un acto ("acto-N"), se enseñan sus gemas (a la derecha) y su árbol (a la izquierda); si no, se esconden. */
function update(id: string | null): void {
  const act = guide ? +(/^acto-(\d+)$/.exec(id ?? "")?.[1] ?? 0) : 0;
  if (act === shownAct && !panel().hidden === !!act) return;
  shownAct = act;
  const show = (el: HTMLElement, content: Node | null) => { el.replaceChildren(...(content ? [content] : [])); el.hidden = !content; };
  show(panel(), act && guide ? <ActContent data={guide} act={act} /> : null);
  show(treePanel(), act && guide ? <ActTree data={guide} act={act} /> : null);
  placeTree();
  redrawTree?.();
}

/** Engancha el panel al índice; lo llama el arranque una sola vez. */
export function initActGems(): void {
  onCurrentSection(update);
  addEventListener("resize", () => { placeTree(); redrawTree?.(); });
}
