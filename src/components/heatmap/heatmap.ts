/* Mapa de calor del árbol de pasivas en un canvas, con los colores del tema. */

/** Zoom y desplazamiento (px CSS) de cada mapa; pos da la posición en pantalla de un nodo, para el tooltip. */
interface HeatView { z: number; x: number; y: number; pos?: (n: TreeNode) => [number, number]; taken?: Set<string>; num?: Map<string, number> }
const heatViews = new WeakMap<HTMLCanvasElement, HeatView>();

/** Icono del nodo recortado de la hoja de sprites del CDN de GGG y escalado a size px; sin conexión simplemente no aparece. */
function nodeIcon(n: TreeNode, size: number): HTMLSpanElement | null {
  if (!n.icon) return null;
  const [sheet, x, y, w] = n.icon, [url, sw, sh] = SHEETS[sheet], k = size / w, img = document.createElement("span");
  img.className = "node-icon";
  img.style.cssText = `width:${size}px;height:${size}px;background:url("${url}") ${-x * k}px ${-y * k}px / ${sw * k}px ${sh * k}px`;
  return img;
}

const hexAlpha =(a: number): string => Math.round(a * 255).toString(16).padStart(2, "0");

/**
 * Pinta el árbol: aristas y nodos tenues, el calor de los nodos cogidos y los puntos indispensables numerados.
 * key: [[nodo, número en la lista de indispensables]], para que el número no cambie al filtrar por etapa.
 * frame: nodos que fijan el encuadre (el árbol final), para que las etapas se vean en el mismo sitio.
 */
function drawHeat(canvas: HTMLCanvasElement, taken: string[], key: [id: string, num: number][], mode: string, frame: string[] = taken): void {
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
addEventListener("resize", () => redrawHeat?.());
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => redrawHeat?.());

/**
 * Mapa interactivo: arrastrar mueve, Ctrl+rueda o pellizco hacen zoom, y pasar el ratón (o tocar) un nodo muestra su nombre y efecto.
 * Añade el tooltip y los botones de zoom junto al canvas, dentro de su contenedor.
 */
function heatControls(canvas: HTMLCanvasElement, redraw: () => void, masteries: [node: string, effect: string][]): void {
  const chosen = new Map(masteries);
  const v: HeatView = { z: 1, x: 0, y: 0 }; heatViews.set(canvas, v);
  canvas.insertAdjacentHTML("afterend", `<div class="heat-tip" hidden></div><div class="heat-zoom"><button data-z="1.5" aria-label="Acercar">+</button><button data-z="0.667" aria-label="Alejar">−</button><button data-z="0" aria-label="Ver entero">⟲</button></div>`);
  const tip = canvas.parentElement!.querySelector<HTMLElement>(".heat-tip")!;
  const zoom = (f: number, cx: number, cy: number) => {
    const z = Math.min(10, Math.max(1, v.z * f)); f = z / v.z;
    v.x = cx - (cx - v.x) * f; v.y = cy - (cy - v.y) * f; v.z = z;
    if (z === 1) v.x = v.y = 0;
    // Con zoom, un dedo mueve el mapa; sin zoom, desplaza la página.
    canvas.style.touchAction = z > 1 ? "none" : "";
    tip.hidden = true; redraw();
  };
  canvas.parentElement!.querySelector(".heat-zoom")!.addEventListener("click", e => {
    const f = +((e.target as Element).closest("button")?.dataset.z ?? NaN); if (isNaN(f)) return;
    if (f) zoom(f, canvas.clientWidth / 2, canvas.clientHeight / 2); else zoom(1 / v.z, 0, 0);
  });
  const at = (e: { clientX: number; clientY: number }): [number, number] => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // Ctrl+rueda (y el pellizco del trackpad, que llega así): la rueda sola sigue desplazando la página.
  canvas.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.004), ...at(e)); }, { passive: false });

  const showTip = (cx: number, cy: number) => {
    let best: TreeNode | null = null, bestId = "", bd = 12 ** 2;
    for (const [id, n] of Object.entries(NODES)) {
      if (n.ascendancy || !v.pos) continue;
      const [x, y] = v.pos(n), d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bd) { bd = d; best = n; bestId = id; }
    }
    tip.hidden = !best; if (!best) return;
    const el = (tag: string, cls: string, text: string) => Object.assign(document.createElement(tag), { className: cls, textContent: text });
    const head = el("div", "heat-tip-head", "");
    const img = nodeIcon(best, 36); if (img) head.append(img);
    const taken = v.taken?.has(bestId), num = v.num?.get(bestId);
    const kind = ["", "Notable", "Keystone", "Maestría", "Joya", "Inicio"][best.type];
    head.append(el("div", "", ""));
    head.lastElementChild!.append(el("b", "", best.name), el("small", taken ? "taken" : "", [kind, taken ? "Cogido" : "No cogido", num ? `nº ${num} de la lista` : ""].filter(Boolean).join(" · ")));
    const effect = best.type === NODE.MASTERY && taken ? MASTERIES[bestId]?.[chosen.get(bestId) ?? ""] : "";
    tip.replaceChildren(head, ...(effect ? effect.split("\n") : best.stats).map(t => el("p", "", t)), ...best.reminder.map(t => el("p", "reminder", t)));
    const [x, y] = v.pos!(best);
    tip.style.left = Math.min(x + 12, canvas.clientWidth - tip.offsetWidth) + "px";
    tip.style.top = (y + 12 + tip.offsetHeight > canvas.clientHeight ? y - 12 - tip.offsetHeight : y + 12) + "px";
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
