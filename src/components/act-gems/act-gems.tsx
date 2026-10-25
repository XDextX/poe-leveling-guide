/* Los huecos de los paneles del acto: vacíos y ocultos hasta que act-gems-panel.tsx los rellena. */

import "./act-gems.css";

/** Los dos paneles del acto, en la página: las gemas (a la derecha de la guía) y el árbol (a la izquierda, bajo el índice). */
export const ActGems: Component<{}, DocumentFragment> = () => (
  <>
    <aside id="act-gems" class="panel act-gems" aria-label="Gemas del acto" hidden />
    <aside id="act-tree" class="panel act-gems act-tree" aria-label="Árbol del acto" hidden />
  </>
) as DocumentFragment;
