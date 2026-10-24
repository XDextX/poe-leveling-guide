/* Controles del mapa de calor: arrastrar mueve, Ctrl+rueda, pellizco o botones hacen zoom, y pasar el ratón (o tocar) un nodo muestra su ficha. */

import { MASTERIES, NODE, NODES } from "../../js/data";
import { placeTip } from "../float-tip/float-tip";
import { heatViews } from "../heatmap/heatmap";
import type { HeatView } from "../heatmap/heatmap";
import { NodeTip } from "../node-tip/node-tip";
import "./heat-controls.css";

/** Añade la ficha y los botones de zoom junto al canvas, dentro de su contenedor, y engancha los gestos. `masteries` son las maestrías elegidas. */
export function heatControls(canvas: HTMLCanvasElement, redraw: () => void, masteries: [node: string, effect: string][]): void {
  const chosen = new Map(masteries);
  const v: HeatView = { z: 1, x: 0, y: 0 }; heatViews.set(canvas, v);
  const tip = <div class="heat-tip" hidden /> as HTMLDivElement;
  const zoom = (f: number, cx: number, cy: number) => {
    const z = Math.min(10, Math.max(1, v.z * f)); f = z / v.z;
    v.x = cx - (cx - v.x) * f; v.y = cy - (cy - v.y) * f; v.z = z;
    if (z === 1) v.x = v.y = 0;
    // Con zoom, un dedo mueve el mapa; sin zoom, desplaza la página.
    canvas.style.touchAction = z > 1 ? "none" : "";
    tip.hidden = true; redraw();
  };
  // f > 1 acerca, f < 1 aleja; 0 vuelve a la vista entera. Siempre hacia el centro del mapa.
  const zoomButton = (f: number, label: string, text: string) =>
    <button aria-label={label} onClick={() => f ? zoom(f, canvas.clientWidth / 2, canvas.clientHeight / 2) : zoom(1 / v.z, 0, 0)}>{text}</button>;
  canvas.after(tip, <div class="heat-zoom">{zoomButton(1.5, "Acercar", "+")}{zoomButton(0.667, "Alejar", "−")}{zoomButton(0, "Ver entero", "⟲")}</div>);
  const at = (e: { clientX: number; clientY: number }): [number, number] => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // Ctrl+rueda (y el pellizco del trackpad, que llega así): la rueda sola sigue desplazando la página.
  canvas.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.004), ...at(e)); }, { passive: false });

  // Ficha del nodo más cercano al punto, a menos de 12 px.
  const showTip = (cx: number, cy: number) => {
    let best: TreeNode | null = null, bestId = "", bd = 12 ** 2;
    for (const [id, n] of Object.entries(NODES)) {
      if (n.ascendancy || !v.pos) continue;
      const [x, y] = v.pos(n), d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bd) { bd = d; best = n; bestId = id; }
    }
    tip.hidden = !best; if (!best) return;
    const taken = !!v.taken?.has(bestId);
    const effect = best.type === NODE.MASTERY && taken ? MASTERIES[bestId]?.[chosen.get(bestId) ?? ""] ?? "" : "";
    tip.replaceChildren(<NodeTip node={best} taken={taken} num={v.num?.get(bestId)} effect={effect} />);
    placeTip(tip, ...v.pos!(best), canvas.clientWidth, canvas.clientHeight);
  };

  const down = new Map<number, [number, number]>(); let moved = 0;
  canvas.addEventListener("pointerdown", e => { down.set(e.pointerId, at(e)); moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => {
    const p = at(e), prev = down.get(e.pointerId);
    if (!prev) { if (e.pointerType === "mouse") showTip(...p); return; }
    if (down.size === 2) {
      const [a, b] = [...down.values()], other = a === prev ? b : a;
      const d0 = Math.hypot(prev[0] - other[0], prev[1] - other[1]), d1 = Math.hypot(p[0] - other[0], p[1] - other[1]);
      down.set(e.pointerId, p); moved += 99;
      if (d0) zoom(d1 / d0, (p[0] + other[0]) / 2, (p[1] + other[1]) / 2);
      return;
    }
    down.set(e.pointerId, p); moved += Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]);
    if (v.z > 1) { v.x += p[0] - prev[0]; v.y += p[1] - prev[1]; tip.hidden = true; redraw(); }
  });
  const up = (e: PointerEvent) => { if (down.delete(e.pointerId) && moved < 6 && e.type === "pointerup") showTip(...at(e)); };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !down.size) tip.hidden = true; });
}
