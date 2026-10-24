/* Sección desplegable de la guía y sus subtítulos, la base de las demás secciones. */

/**
 * Sección desplegable con su título (HTML) ya puesto.
 * `toc` la apunta en el índice: { id, label, group } (group agrupa entradas, como los actos bajo "Ruta").
 */
function section(summaryHtml: string, className: string, open = true, toc: TocTarget | null = null): HTMLDetailsElement {
  const sec = document.createElement("details");
  sec.className = className;
  sec.open = open;
  sec.innerHTML = `<summary>${summaryHtml}</summary>`;
  if (toc) tocTarget(sec, toc);
  return sec;
}

/** Marca un elemento como destino del índice. */
function tocTarget<E extends HTMLElement>(el: E, { id, label, group }: TocTarget): E {
  el.id = id;
  el.dataset.toc = label;
  if (group) el.dataset.tocGroup = group;
  return el;
}

/** Subtítulo de una sección ("Únicos", "Mapa de calor"…). */
const subhead = (text: string): HTMLHeadingElement => el("h3", "sub", text);
