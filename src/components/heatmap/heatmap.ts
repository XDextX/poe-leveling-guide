/* Mapa de calor del árbol de pasivas en un canvas, con los colores del tema. */

import { EDGES, NODE, NODES } from "../../js/data";
import { nodeScore } from "../../js/stats";
import "./heatmap.css";

/**
 * Estado de cada mapa: zoom y desplazamiento (px CSS), que fijan los controles, y lo que deja el último dibujo para la ficha
 * del nodo: pos (posición en pantalla de un nodo), taken (nodos cogidos) y num (número en la lista de indispensables).
 */
export interface HeatView { z: number; x: number; y: number; pos?: (n: TreeNode) => [number, number]; taken?: Set<string>; num?: Map<string, number> }
export const heatViews = new WeakMap<HTMLCanvasElement, HeatView>();

const hexAlpha = (a: number): string => Math.round(a * 255).toString(16).padStart(2, "0");

/**
 * Pinta el árbol: aristas y nodos tenues, el calor de los nodos cogidos y los puntos indispensables numerados.
 * key: [[nodo, número en la lista de indispensables]], para que el número no cambie al filtrar por etapa.
 * frame: nodos que fijan el encuadre (el árbol final), para que las etapas se vean en el mismo sitio.
 */
export function drawHeat(canvas: HTMLCanvasElement, taken: string[], key: [id: string, num: number][], mode: string, frame: string[] = taken): void {
  // Un repintado pendiente de una guía ya sustituida llega con el canvas fuera de la página (ancho 0): no hay nada que pintar.
  if (!canvas.isConnected) return;
  const css = getComputedStyle(document.documentElement), col = (v: string): string => css.getPropertyValue(v).trim();
  const all = Object.values(NODES).filter(n => !n.ascendancy);
  // Encuadre sobre la zona de la build, con margen: el árbol entero deja los puntos de la build diminutos.
  const own = frame.map(id => NODES[id]), pad = 1200;
  const xs = own.map(n => n.x), ys = own.map(n => n.y);
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const w = canvas.parentElement!.clientWidth, h = Math.min(Math.round(w * (maxY - minY) / (maxX - minX)), Math.round(innerHeight * 0.8)), dpr = devicePixelRatio || 1;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  canvas.width = w * dpr; canvas.height = h * dpr;
  // Misma escala en los dos ejes, centrado en la zona de la build.
  const s = Math.min(w / (maxX - minX), h / (maxY - minY));
  const ox = (w / s - (maxX - minX)) / 2, oy = (h / s - (maxY - minY)) / 2;
  const v = heatViews.get(canvas) ?? { z: 1, x: 0, y: 0 }, S = s * v.z, k = Math.sqrt(v.z);
  const sx = (x: number) => (x - minX + ox) * S + v.x, sy = (y: number) => (y - minY + oy) * S + v.y;
  const X = (x: number) => sx(x) * dpr, Y = (y: number) => sy(y) * dpr;
  v.pos = n => [sx(n.x), sy(n.y)];
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const takenSet = new Set(taken);
  v.taken = takenSet; v.num = new Map(key);
  const edges = (filter: (ia: string, ib: string, a: TreeNode) => boolean) => {
    ctx.beginPath();
    for (let i = 0; i < EDGES.length; i += 2) {
      const a = NODES[EDGES[i]], b = NODES[EDGES[i + 1]];
      if (a && b && filter(String(EDGES[i]), String(EDGES[i + 1]), a)) { ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); }
    }
    ctx.stroke();
  };
  const dot = (n: TreeNode, r: number) => { ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), r * k * dpr, 0, 7); ctx.fill(); };

  ctx.lineWidth = 1 * dpr;
  ctx.strokeStyle = col("--line");
  edges((_ia, _ib, a) => !a.ascendancy);

  // Calor: un degradado por nodo cogido, sumados con "lighter" para que las zonas densas brillen más.
  ctx.globalCompositeOperation = "lighter";
  const r = 500 * S * dpr;
  for (const id of taken) {
    const n = NODES[id], sc = nodeScore(id);
    for (const [k, color] of [["dmg", col("--str")], ["def", col("--int")]] as const) {
      if ((mode !== "both" && mode !== k) || !sc[k]) continue;
      const g = ctx.createRadialGradient(X(n.x), Y(n.y), 0, X(n.x), Y(n.y), r);
      g.addColorStop(0, color + hexAlpha(Math.min(0.7, 0.22 * sc[k])));
      g.addColorStop(1, color + "00");
      ctx.fillStyle = g;
      ctx.fillRect(X(n.x) - r, Y(n.y) - r, 2 * r, 2 * r);
    }
  }
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = col("--muted") + "55";
  for (const n of all) dot(n, n.type === NODE.KEYSTONE ? 2.2 : n.type === NODE.NOTABLE ? 1.6 : 1);
  ctx.strokeStyle = col("--accent"); ctx.lineWidth = 1.5 * dpr;
  edges((ia, ib) => takenSet.has(ia) && takenSet.has(ib));
  ctx.fillStyle = col("--accent");
  for (const id of taken) dot(NODES[id], 2);

  ctx.font = `600 ${10 * dpr}px ${col("--mono") || "monospace"}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const [id, num] of key) {
    const n = NODES[id];
    ctx.fillStyle = col("--card"); ctx.strokeStyle = col("--accent"); ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), 6.5 * dpr, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col("--fg"); ctx.fillText(String(num), X(n.x), Y(n.y) + 0.5 * dpr);
  }
}

// Un solo oyente para todo: el mapa vigente se repinta al cambiar el tamaño o el tema.
let redrawHeat: (() => void) | null = null;
/** Cambia el mapa que se repinta (null: ninguno). */
export function setRedrawHeat(fn: (() => void) | null): void { redrawHeat = fn; }
addEventListener("resize", () => redrawHeat?.());
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => redrawHeat?.());
