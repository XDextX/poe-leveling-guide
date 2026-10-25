/* Los huecos de los paneles laterales: vacíos y ocultos hasta que act-gems-panel.tsx y progress.tsx los rellenan. */

import "./act-gems.css";

/**
 * Los paneles que acompañan a la guía: a la derecha, en una columna, el avance y las gemas del acto; a la izquierda, bajo el índice, el
 * árbol del acto. El botón "Avance" abre el resumen del avance en pantallas estrechas, como el de "Índice".
 */
export const ActGems: Component<{}, DocumentFragment> = () => (
  <>
    <div id="side-right" class="side-right">
      <aside id="progress-mini" class="panel progress-mini" aria-label="Mi avance" hidden />
      <aside id="act-gems" class="panel act-gems" aria-label="Gemas del acto" hidden />
    </div>
    <button id="progress-toggle" class="toc-toggle prog-toggle" aria-controls="progress-mini" aria-expanded="false" hidden>Avance</button>
    <aside id="act-tree" class="panel act-gems act-tree" aria-label="Árbol del acto" hidden />
  </>
) as DocumentFragment;
