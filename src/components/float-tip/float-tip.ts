/* Colocación de las fichas flotantes (nodo del árbol, único) junto a un punto. */

/**
 * Pone la ficha junto al punto (x, y) sin salirse de una caja de w × h px: a la derecha y debajo si cabe; si no cabe debajo, encima.
 * x, y, w y h van en el mismo sistema que left/top de la ficha (el de su contenedor, o la ventana si es position: fixed).
 */
function placeTip(tip: HTMLElement, x: number, y: number, w: number, h: number, gap = 12): void {
  tip.style.left = Math.max(0, Math.min(x + gap, w - tip.offsetWidth)) + "px";
  tip.style.top = Math.max(0, y + gap + tip.offsetHeight > h ? y - gap - tip.offsetHeight : y + gap) + "px";
}
