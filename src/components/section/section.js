/* Sección desplegable y lista nombre/texto, la base de las demás secciones. */

/**
 * Sección desplegable con su título (HTML) ya puesto.
 * `toc` la apunta en el índice: { id, label, group } (group agrupa entradas, como los actos bajo "Ruta").
 */
function section(summaryHtml, className, open = true, toc = null) {
  const sec = document.createElement("details");
  sec.className = className;
  sec.open = open;
  sec.innerHTML = `<summary>${summaryHtml}</summary>`;
  if (toc) tocTarget(sec, toc);
  return sec;
}

/** Marca un elemento como destino del índice. */
function tocTarget(el, { id, label, group }) {
  el.id = id;
  el.dataset.toc = label;
  if (group) el.dataset.tocGroup = group;
  return el;
}

/** Lista de pares [nombre, texto] como <li><b>nombre</b><p>texto</p></li>, sin interpretar HTML. */
function fillNamed(ul, pairs) {
  for (const [name, text] of pairs) {
    const li = document.createElement("li");
    li.innerHTML = "<b></b><p></p>";
    li.querySelector("b").textContent = name;
    li.querySelector("p").textContent = text;
    ul.append(li);
  }
}
