/*
 * El índice de la guía: un enlace por sección marcada con data-toc, desplazamiento suave y la sección actual resaltada.
 * En pantalla ancha va fijo al lado de la guía; en estrecha, un botón flotante lo abre como panel.
 * <TocNav> es el marcado (vacío y oculto hasta que hay guía); renderToc lo rellena, hideToc lo oculta e initToc engancha
 * los oyentes de la ventana. Ningún otro módulo necesita saber sus ids.
 */

import "./toc-nav.css";

// Los dos elementos de <TocNav>.
const tocNav = () => document.getElementById("toc")!;
const tocButton = () => document.getElementById("toc-toggle")!;

// Se consultan al usarlas, no al cargar el módulo: <TocNav> está en la página prerenderizada, que se ejecuta en Node, sin ventana.
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// Mismo ancho que la media query de toc-nav.css a partir del cual el índice cabe al lado de la guía.
const tocBeside = () => matchMedia("(min-width: 1260px)").matches;
// Una sección cuenta como "la actual" cuando su inicio pasa por encima de esta línea (px desde arriba).
const SPY_LINE = 100;
let tocTargets: HTMLElement[] = [], tocLinks = new Map<HTMLElement, HTMLAnchorElement>(), tocPinned: HTMLElement | null = null;

/** Índice y botón para abrirlo en pantalla estrecha. */
export const TocNav: Component<{}, DocumentFragment> = () => (
  <>
    <nav id="toc" class="panel toc" aria-label="Índice" hidden />
    <button id="toc-toggle" class="toc-toggle" aria-controls="toc" aria-expanded="false" hidden onClick={(e: MouseEvent) => toggleToc(e)}>Índice</button>
  </>
) as DocumentFragment;

/** Abre o cierra el índice en pantalla estrecha (en ancha siempre está a la vista). */
function setTocOpen(open: boolean): void {
  tocNav().classList.toggle("open", open);
  tocButton().setAttribute("aria-expanded", String(open));
}

/** Lleva a una sección: la despliega si estaba plegada y se desplaza hasta ella (sin animar si el sistema pide reducir movimiento). */
function goTo(target: HTMLElement): void {
  if (target instanceof HTMLDetailsElement) target.open = true;
  tocPinned = target;
  if (!tocBeside()) setTocOpen(false);
  const from = scrollY;
  target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  // Algunos navegadores ignoran el desplazamiento suave (la emulación de móvil de Chromium, por ejemplo):
  // si la página no se ha movido, se salta sin animar.
  setTimeout(() => {
    if (scrollY === from && Math.abs(target.getBoundingClientRect().top) > SPY_LINE) target.scrollIntoView({ block: "start" });
    updateTocCurrent();
  }, 400);
  // Si ya no hay sitio para desplazarse (final de la página), no llega ningún "scroll": se actualiza aquí.
  updateTocCurrent();
}

/** Sección actual: la última cuyo inicio ya pasó la línea; al final de la página, la pulsada si está a la vista. */
function updateTocCurrent(): void {
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const pinnedInView = tocPinned && tocPinned.getBoundingClientRect().top < innerHeight;
  const current = atBottom && pinnedInView ? tocPinned : tocTargets.findLast(t => t.getBoundingClientRect().top <= SPY_LINE);
  tocLinks.forEach((a, t) => a.toggleAttribute("aria-current", t === current));
}

/** Rellena el índice con los destinos de la página, en orden; las entradas con grupo (los actos) van juntas en una fila. */
export function renderToc(): void {
  const nav = tocNav();
  tocTargets = [...document.querySelectorAll<HTMLElement>("main [data-toc]")].filter(el => !el.closest("[hidden]"));
  tocLinks = new Map(); tocPinned = null;
  nav.innerHTML = `<b class="toc-title">Índice</b><ol></ol>`;
  const ol = nav.querySelector("ol")!, groups = new Map<string, Element>();
  for (const el of tocTargets) {
    const a = document.createElement("a");
    a.href = "#" + el.id;
    a.textContent = el.dataset.toc ?? "";
    a.onclick = e => { e.preventDefault(); goTo(el); };
    tocLinks.set(el, a);
    const group = el.dataset.tocGroup;
    if (!group) { const li = document.createElement("li"); li.append(a); ol.append(li); continue; }
    if (!groups.has(group)) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="toc-group"></span><span class="toc-chips"></span>`;
      li.firstElementChild!.textContent = group;
      ol.append(li);
      groups.set(group, li.lastElementChild!);
    }
    a.className = "chip";
    a.setAttribute("aria-label", `${group} ${el.dataset.toc}`);
    groups.get(group)!.append(a);
  }
  nav.hidden = tocButton().hidden = tocTargets.length === 0;
  setTocOpen(false);
  updateTocCurrent();
}

/** Sin guía (campo vacío o código inválido) tampoco hay índice. */
export function hideToc(): void {
  tocNav().hidden = tocButton().hidden = true;
}

/** Clic en el botón flotante: abre o cierra el panel. */
function toggleToc(e: MouseEvent): void { e.stopPropagation(); setTocOpen(!tocNav().classList.contains("open")); }

let tocFrame = 0;
/** Engancha los oyentes de la ventana; lo llama el arranque una sola vez. */
export function initToc(): void {
  // Un solo oyente de desplazamiento para todo, agrupado por fotograma.
  addEventListener("scroll", () => { if (!tocFrame) tocFrame = requestAnimationFrame(() => { tocFrame = 0; updateTocCurrent(); }); }, { passive: true });
  // La rueda o el dedo del usuario sueltan la sección pulsada: a partir de ahí manda la posición.
  for (const ev of ["wheel", "touchmove", "keydown"]) addEventListener(ev, () => { tocPinned = null; }, { passive: true });
  addEventListener("keydown", e => { if (e.key === "Escape") setTocOpen(false); });
  addEventListener("click", e => { if (!tocBeside() && !(e.target as Element).closest("#toc")) setTocOpen(false); });
}
