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
// El índice cabe al lado de la guía justo cuando toc-nav.css oculta el botón flotante (su media query de ancho), así que se
// lee de ahí y el ancho no se repite. El botón también está oculto mientras no hay guía, pero entonces no hay panel que abrir.
const tocBeside = () => getComputedStyle(tocButton()).display === "none";
// Una sección cuenta como "la actual" cuando su inicio pasa por encima de esta línea (px desde arriba).
const SPY_LINE = 100;
let tocTargets: HTMLElement[] = [], tocPinned: HTMLElement | null = null;

/** Índice y botón para abrirlo en pantalla estrecha. */
export const TocNav: Component<{}, DocumentFragment> = () => (
  <>
    <nav id="toc" class="panel toc" aria-label="Índice" hidden />
    <button id="toc-toggle" class="toc-toggle" aria-controls="toc" aria-expanded="false" hidden onClick={toggleToc}>Índice</button>
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
  tocNav().querySelectorAll("a").forEach(a => a.toggleAttribute("aria-current", !!current && a.getAttribute("href") === "#" + current.id));
}

interface TocLinksProps {
  /** Los destinos de la página, en orden; cada uno con su id y su data-toc (el texto del enlace). */
  targets: HTMLElement[];
  /** Al pulsar un enlace. */
  onGo: (target: HTMLElement) => void;
}

/** El contenido del índice: un enlace por destino; los que tienen grupo (los actos) van juntos, como chips, en una fila. */
const TocLinks: Component<TocLinksProps, DocumentFragment> = ({ targets, onGo }) => {
  // Una fila por destino suelto y una por grupo, en el sitio de su primer miembro.
  const rows: { group: string | null; items: HTMLElement[] }[] = [];
  for (const el of targets) {
    const group = el.dataset.tocGroup ?? null, row = group ? rows.find(r => r.group === group) : undefined;
    if (row) row.items.push(el); else rows.push({ group, items: [el] });
  }
  const link = (el: HTMLElement, group?: string) => (
    <a href={"#" + el.id} class={group ? "chip" : undefined} aria-label={group ? `${group} ${el.dataset.toc}` : undefined}
      onClick={(e: MouseEvent) => { e.preventDefault(); onGo(el); }}>{el.dataset.toc}</a>
  );
  return (
    <>
      <b class="toc-title">Índice</b>
      <ol>
        {rows.map(({ group, items }) => (
          <li>
            {group && <span class="toc-group">{group}</span>}
            {group ? <span class="toc-chips">{items.map(el => link(el, group))}</span> : link(items[0])}
          </li>
        ))}
      </ol>
    </>
  ) as DocumentFragment;
};

/** Rellena el índice con los destinos de la página, en orden. */
export function renderToc(): void {
  tocTargets = [...document.querySelectorAll<HTMLElement>("main [data-toc]")].filter(el => !el.closest("[hidden]"));
  tocPinned = null;
  tocNav().replaceChildren(<TocLinks targets={tocTargets} onGo={goTo} />);
  tocNav().hidden = tocButton().hidden = tocTargets.length === 0;
  setTocOpen(false);
  updateTocCurrent();
}

/** Sin guía (campo vacío o código inválido) tampoco hay índice. */
export function hideToc(): void {
  tocNav().hidden = tocButton().hidden = true;
}

/** Clic en el botón flotante: abre o cierra el panel. */
function toggleToc(): void { setTocOpen(!tocNav().classList.contains("open")); }

let tocFrame = 0;
/** Engancha los oyentes de la ventana; lo llama el arranque una sola vez. */
export function initToc(): void {
  // Un solo oyente de desplazamiento para todo, agrupado por fotograma.
  addEventListener("scroll", () => { if (!tocFrame) tocFrame = requestAnimationFrame(() => { tocFrame = 0; updateTocCurrent(); }); }, { passive: true });
  // La rueda o el dedo del usuario sueltan la sección pulsada: a partir de ahí manda la posición.
  for (const ev of ["wheel", "touchmove", "keydown"]) addEventListener(ev, () => { tocPinned = null; }, { passive: true });
  addEventListener("keydown", e => { if (e.key === "Escape") setTocOpen(false); });
  // Un clic fuera del panel lo cierra; dentro del panel o en su botón no (el botón ya lo abre o lo cierra él).
  addEventListener("click", e => { if (!tocBeside() && !(e.target as Element).closest("#toc, #toc-toggle")) setTocOpen(false); });
}
