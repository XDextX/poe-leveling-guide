/* Lista de pares nombre/texto, como las notas de "Por otras vías" o las maestrías. */

/** Lista de pares [nombre, texto] como <li><b>nombre</b><p>texto</p></li>. */
function fillNamed(ul: Element, pairs: [name: string, text: string][]): void {
  for (const [name, text] of pairs) ul.append(el("li", "", "", el("b", "", name), el("p", "", text)));
}
