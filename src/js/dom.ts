/* Utilidades del DOM. El JSX tiene su propio runtime en src/jsx/jsx-runtime.ts. */

/** Elemento de la página por id. Todos los que se piden existen en la página; T afina el tipo (textarea, input…). */
export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
/** Texto escapado para meterlo en un HTML hecho a mano. */
export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ESCAPES[c]);
