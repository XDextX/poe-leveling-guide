/* El índice de la guía y su botón flotante, vacíos y ocultos hasta que hay guía (los rellena renderToc, en toc.ts). */

import { toggleToc } from "../toc/toc";

/** Índice y botón para abrirlo en pantalla estrecha. */
export const TocNav: Component<{}, DocumentFragment> = () => (
  <>
    <nav id="toc" class="panel toc" aria-label="Índice" hidden />
    <button id="toc-toggle" class="toc-toggle" aria-controls="toc" aria-expanded="false" hidden onClick={(e: MouseEvent) => toggleToc(e)}>Índice</button>
  </>
) as DocumentFragment;
