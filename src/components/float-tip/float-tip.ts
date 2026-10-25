/* Colocación de las fichas flotantes (nodo del árbol, único) junto a un punto o al ratón. */

/**
 * Pone la ficha junto al punto (x, y) sin salirse de una caja de w × h px: a la derecha y debajo si cabe; si no cabe debajo, encima.
 * x, y, w y h van en el mismo sistema que left/top de la ficha (el de su contenedor, o la ventana si es position: fixed).
 */
export function placeTip(tip: HTMLElement, x: number, y: number, w: number, h: number, gap = 12): void {
  tip.style.left = Math.max(0, Math.min(x + gap, w - tip.offsetWidth)) + "px";
  tip.style.top = Math.max(0, y + gap + tip.offsetHeight > h ? y - gap - tip.offsetHeight : y + gap) + "px";
}

/** Con el ratón sobre `target`, la ficha (que el CSS muestra y deja en su sitio) sigue al cursor; al salir vuelve a su sitio. */
export function followCursor(target: HTMLElement, tip: HTMLElement, gap = 16): void {
  target.addEventListener("mousemove", e => {
    tip.style.position = "fixed";
    placeTip(tip, e.clientX, e.clientY, innerWidth, innerHeight, gap);
  });
  target.addEventListener("mouseleave", () => { tip.style.cssText = ""; });
}
