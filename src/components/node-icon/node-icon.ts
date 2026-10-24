/* Icono de un nodo del árbol, recortado de la hoja de sprites del CDN de GGG. */

/** Icono del nodo escalado a size px, o null si no tiene; sin conexión simplemente no aparece. */
const nodeIcon: Component<[n: TreeNode, size: number], HTMLSpanElement | null> = (n, size) => {
  if (!n.icon) return null;
  const [sheet, x, y, w] = n.icon, [url, sw, sh] = SHEETS[sheet], k = size / w, img = el("span", "node-icon");
  img.style.cssText = `width:${size}px;height:${size}px;background:url("${url}") ${-x * k}px ${-y * k}px / ${sw * k}px ${sh * k}px`;
  return img;
};
