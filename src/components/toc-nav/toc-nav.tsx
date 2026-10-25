/*
 * El índice de la guía: un enlace por sección marcada con data-toc, desplazamiento suave y la sección actual resaltada.
 * En pantalla ancha va fijo al lado de la guía; en estrecha, un botón flotante lo abre como panel.
 * <TocNav> es el marcado (vacío y oculto hasta que hay guía); renderToc lo rellena, hideToc lo oculta e initToc engancha
 * los oyentes de la ventana. onCurrentSection avisa de qué sección se lee. Ningún otro módulo necesita saber sus ids.
 * Qué filas lleva el índice y cuál es la sección actual lo decide src/js/toc.ts, sin DOM.
 */

import { currentSection, tocRows } from "../../js/toc";
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

// Los destinos de la página, en orden, y el que el usuario acaba de pulsar (manda sobre la posición hasta que desplaza a mano).
let targets: HTMLElement[] = [], pinned: HTMLElement | null = null;
const listeners: ((id: string | null) => void)[] = [];

/** Avisa de qué sección se está leyendo (su id, o null si ninguna) cada vez que se calcula. */
export function onCurrentSection(listener: (id: string | null) => void): void { listeners.push(listener); }

/** Índice y botón para abrirlo en pantalla estrecha. */
export const TocNav: Component<{}, DocumentFragment> = () => (
  <>
    <nav id="toc" class="panel toc" aria-label="Índice" hidden />
    <button id="toc-toggle" class="toc-toggle" aria-controls="toc" aria-expanded="false" hidden onClick={() => setOpen(!tocNav().classList.contains("open"))}>Índice</button>
  </>
) as DocumentFragment;

/** Abre o cierra el índice en pantalla estrecha (en ancha siempre está a la vista). */
function setOpen(open: boolean): void {
  tocNav().classList.toggle("open", open);
  tocButton().setAttribute("aria-expanded", String(open));
}

/** Resalta en el índice la sección que se lee y avisa a quien escucha. */
function updateCurrent(): void {
  const position = (el: HTMLElement) => ({ id: el.id, top: el.getBoundingClientRect().top });
  const id = currentSection(targets.map(position), {
    line: SPY_LINE, atBottom: innerHeight + scrollY >= document.documentElement.scrollHeight - 2, pinned: pinned ? position(pinned) : undefined, viewportHeight: innerHeight,
  });
  tocNav().querySelectorAll("a").forEach(a => a.toggleAttribute("aria-current", !!id && a.getAttribute("href") === "#" + id));
  listeners.forEach(listener => listener(id));
}

/** Lleva a una sección o subtítulo: despliega la sección (o la que lo contiene) si estaba plegada y se desplaza hasta él (sin animar si el sistema pide reducir movimiento). */
function goTo(id: string): void {
  const target = document.getElementById(id)!;
  for (let d = target.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
  pinned = target;
  if (!tocBeside()) setOpen(false);
  const from = scrollY;
  target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  // Algunos navegadores ignoran el desplazamiento suave (la emulación de móvil de Chromium, por ejemplo):
  // si la página no se ha movido, se salta sin animar.
  setTimeout(() => {
    if (scrollY === from && Math.abs(target.getBoundingClientRect().top) > SPY_LINE) target.scrollIntoView({ block: "start" });
    updateCurrent();
  }, 400);
  // Si ya no hay sitio para desplazarse (final de la página), no llega ningún "scroll": se actualiza aquí.
  updateCurrent();
}

interface TocLinksProps {
  /** Los destinos de la página, en orden. */
  targets: TocTarget[];
  /** Al pulsar un enlace, con el id de su destino. */
  onGo: (id: string) => void;
}

/** El contenido del índice: un enlace por destino; los que tienen grupo (los actos) van juntos, como chips, en una fila. */
const TocLinks: Component<TocLinksProps, DocumentFragment> = ({ targets, onGo }) => {
  const link = (t: TocTarget, group?: string) => (
    <a href={"#" + t.id} class={group ? "chip" : undefined} aria-label={group ? `${group} ${t.label}` : undefined}
      onClick={(e: MouseEvent) => { e.preventDefault(); onGo(t.id); }}>{t.label}</a>
  );
  return (
    <>
      <b class="toc-title">Índice</b>
      <ol>
        {tocRows(targets).map(({ group, items, nested }) => (
          <li>
            {group && <span class="toc-group">{group}</span>}
            {group ? <span class="toc-chips">{items.map(t => link(t, group))}</span> : link(items[0])}
            {nested.length > 0 && <ol class="toc-sub">{nested.map(t => <li>{link(t)}</li>)}</ol>}
          </li>
        ))}
      </ol>
    </>
  ) as DocumentFragment;
};

/** Rellena el índice con los destinos de la página (los marcados con data-toc fuera de lo oculto), en orden. */
export function renderToc(): void {
  targets = [...document.querySelectorAll<HTMLElement>("main [data-toc]")].filter(el => !el.closest("[hidden]"));
  pinned = null;
  const entries = targets.map((el): TocTarget => ({ id: el.id, label: el.dataset.toc!, group: el.dataset.tocGroup, parent: el.dataset.tocParent }));
  tocNav().replaceChildren(<TocLinks targets={entries} onGo={goTo} />);
  tocNav().hidden = tocButton().hidden = targets.length === 0;
  setOpen(false);
  updateCurrent();
}

/** Sin guía (campo vacío o código inválido) tampoco hay índice. */
export function hideToc(): void {
  tocNav().hidden = tocButton().hidden = true;
}

let frame = 0;
/** Engancha los oyentes de la ventana; lo llama el arranque una sola vez. */
export function initToc(): void {
  // Un solo oyente de desplazamiento para todo, agrupado por fotograma.
  addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; updateCurrent(); }); }, { passive: true });
  // La rueda o el dedo del usuario sueltan la sección pulsada: a partir de ahí manda la posición.
  for (const ev of ["wheel", "touchmove", "keydown"]) addEventListener(ev, () => { pinned = null; }, { passive: true });
  addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
  // Un clic fuera del panel lo cierra; dentro del panel o en su botón no (el botón ya lo abre o lo cierra él).
  addEventListener("click", e => { if (!tocBeside() && !(e.target as Element).closest("#toc, #toc-toggle")) setOpen(false); });
}
