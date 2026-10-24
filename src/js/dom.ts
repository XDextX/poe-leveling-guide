/* Utilidades del DOM que usan todos los módulos y componentes. */

/** Elemento de la página por id. Todos los que se piden existen en index.html; T afina el tipo (textarea, input…). */
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
/** Texto escapado para meterlo en un HTML hecho a mano. */
const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ESCAPES[c]);

/** Elemento con su clase, su texto (siempre como texto, nunca como HTML) y sus hijos. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "", ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  e.append(...children);
  return e;
}
