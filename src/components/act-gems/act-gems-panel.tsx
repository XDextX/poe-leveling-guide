/*
 * Panel con las gemas del acto que se está leyendo, en el margen derecho de la guía (solo cuando cabe, como el índice a la izquierda).
 * Enseña el montaje del tramo si hay "Leveling sugerido" y, de cada habilidad de la build, las gemas que ya se tienen en ese acto.
 * setActGems le da la guía; initActGems lo engancha al índice, que dice qué sección se está leyendo.
 * Va aparte del marcado (act-gems.tsx) porque usa los datos del juego, que la página prerenderizada (en Node) no puede cargar.
 */

import { GEMS } from "../../js/data";
import type { GuideData } from "../../js/guide";
import { Gem } from "../gem/gem";
import { GemLine } from "../gem-line/gem-line";
import { onCurrentSection } from "../toc-nav/toc-nav";

const panel = () => document.getElementById("act-gems")!;

let guide: GuideData | null = null, shownAct = 0;

interface ActContentProps { data: GuideData; act: number }

/** Lo que va en el panel de un acto, o null si no hay nada que enseñar. */
const ActContent: Component<ActContentProps, DocumentFragment | null> = ({ data, act }) => {
  const stage = data.skills.find(s => s.acts[0] <= act && act <= s.acts[1]);
  // De cada habilidad de la build, las gemas que ya se tienen al llegar a este acto: las del inicio y las que da la ruta hasta aquí.
  const has = (id: string) => data.plan.start.includes(id) || (data.plan.got.get(id)?.act ?? Infinity) <= act;
  const groups = data.build.groups.map(ids => ids.filter(has)).filter(ids => ids.length > 0);
  if (!stage && !groups.length) return null;
  return (
    <>
      <b class="act-gems-title">Acto {act}</b>
      {stage && (
        <>
          <span class="act-gems-sub">Leveling sugerido</span>
          {stage.skill && <GemLine how={stage.own ? "Tu habilidad" : "Habilidad"} ids={[stage.skill]} note={stage.mainAt ? `Cambia a ${GEMS[data.build.main!.id].name} desde nv ${stage.mainAt}` : ""} />}
          {stage.supports.length > 0 && <GemLine how="Soportes" ids={stage.supports} />}
        </>
      )}
      {groups.length > 0 && <span class="act-gems-sub">Tus habilidades</span>}
      {groups.map(ids => <div class="act-gems-group">{ids.map(id => <Gem id={id} />)}</div>)}
    </>
  ) as DocumentFragment;
};

/** Cambia la guía de la que sale el panel (null sin guía). */
export function setActGems(data: GuideData | null): void {
  guide = data;
  shownAct = 0;
  if (!data) panel().hidden = true;
}

/** Lo que se está leyendo: si es un acto ("acto-N"), se enseñan sus gemas; si no, el panel se esconde. */
function update(id: string | null): void {
  const act = guide ? +(/^acto-(\d+)$/.exec(id ?? "")?.[1] ?? 0) : 0;
  if (act === shownAct && !panel().hidden === !!act) return;
  shownAct = act;
  const content = act && guide ? <ActContent data={guide} act={act} /> : null;
  panel().replaceChildren(...(content ? [content] : []));
  panel().hidden = !content;
}

/** Engancha el panel al índice; lo llama el arranque una sola vez. */
export function initActGems(): void { onCurrentSection(update); }
