/* Una gema: su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */

import { cost, shortCurrency } from "../../js/cost";
import { GEMS } from "../../js/data";
import { isSupport } from "../../js/gems";
import { hideGemTip, moveGemTip, showGemTip } from "../gem-tip/gem-tip";
import { gemIcon } from "../item-icon/item-icon";
import "./gem.css";

// Gemas de leveling sugeridas que no están en la build: se marcan como "sugerida" allí donde aparezcan.
export let suggested = new Set<string>();
/** Cambia las gemas sugeridas; lo llama el arranque al componer cada guía. */
export function setSuggested(ids: Set<string>): void { suggested = ids; }

/**
 * Clave con que se guardan en el navegador las gemas marcadas y las elecciones de una build vista con una clase. Va por la habilidad
 * principal y la ascendencia y no por todas las gemas: volver a pegar la build con una gema más o menos no debe perder el avance, y
 * dos builds de la misma clase y habilidad pero distinta ascendencia no deben compartirlo.
 */
export const buildKey = (cls: string, build: Build): string => "poe-gemas:" + cls + ":" + (build.main?.id ?? build.gems[0]?.name ?? "") + ":" + (build.ascend ?? "");

/** Los avances de los datos guardados por cada build: sufijos de buildKey con lo que se guarda aparte (elecciones, acto, mi leveling). */
const SUFFIXES = ["", ":eleccion", ":acto", ":mi-leveling"];

/**
 * Pasa lo guardado con las claves antiguas (todas las gemas por su nombre, y habilidad principal sin ascendencia) a la clave actual,
 * si esta aún no tiene nada. No borra las antiguas: otra build de la misma clase y habilidad puede seguir usándolas.
 */
export function migrateKeys(cls: string, build: Build): void {
  const old = ["poe-gemas:" + cls + ":" + build.gems.map(g => g.name).join("|"), "poe-gemas:" + cls + ":" + (build.main?.id ?? build.gems[0]?.name ?? "")];
  try {
    for (const suffix of SUFFIXES) {
      const now = buildKey(cls, build) + suffix;
      if (localStorage.getItem(now) !== null) continue;
      const from = old.map(k => localStorage.getItem(k + suffix)).find(v => v !== null);
      if (from !== undefined && from !== null) localStorage.setItem(now, from);
    }
  } catch {}
}

// Gemas marcadas como conseguidas, por build; si el navegador no deja guardar, la guía funciona igual.
export const doneStore = {
  key: "", ids: new Set<string>(),
  listeners: new Set<() => void>(),
  /** Avisa cada vez que se marca o desmarca una gema; devuelve cómo dejar de recibir avisos. */
  onChange(fn: () => void): () => void { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; },
  /** Carga las marcadas de una build vista con una clase: cada combinación se guarda aparte. */
  load(cls: string, build: Build) {
    this.key = buildKey(cls, build);
    try { this.ids = new Set<string>(JSON.parse(localStorage.getItem(this.key) ?? "null") || []); } catch { this.ids = new Set<string>(); }
  },
  set(id: string, on: boolean) {
    on ? this.ids.add(id) : this.ids.delete(id);
    try { localStorage.setItem(this.key, JSON.stringify([...this.ids])); } catch {}
    this.listeners.forEach(fn => fn());
  },
};

const shortCost = (level: number): string => shortCurrency(cost(level));
/** Totales de moneda de unas compras, como texto: "2× Orb of Alteration, 1× Scroll of Wisdom". */
export function costText(ids: string[]): string {
  const total: Record<string, number> = {};
  ids.forEach(id => { const c = cost(GEMS[id].level); total[c] = (total[c] || 0) + 1; });
  return Object.entries(total).map(([c, n]) => `${n}× ${c}`).join(", ");
}

const hideIcon = (e: Event) => { (e.target as HTMLImageElement).parentElement!.hidden = true; };
// El CDN sirve las gemas de habilidad como capas lado a lado en una tira (decoración | vacío | gema de color), no como un
// cuadrado: se superponen con dos fondos en la misma caja. Las de soporte ya son un cuadrado y se quedan como <img>.
const layer = (box: HTMLElement, src: string) => { box.style.backgroundImage = `url(${src}), url(${src})`; box.classList.add("layered"); };
// Las de habilidad salen ya superpuestas, sin esperar a que cargue la imagen para saberlo; al cargar se confirma por la forma
// (una tira es más ancha que alta) y, si resulta ser un cuadrado, se deja como <img>.
const layerIcon = (e: Event) => {
  const img = e.target as HTMLImageElement, box = img.parentElement!;
  if (img.naturalWidth > img.naturalHeight) layer(box, img.src);
  else { box.classList.remove("layered"); box.style.backgroundImage = ""; }
};

/** El dibujo de una gema (24 px), o nada si no tiene: <GemIcon id={id} />. */
export const GemIcon: Component<{ id: string }, HTMLSpanElement | null> = ({ id }) => {
  const { icon } = GEMS[id];
  if (!icon) return null;
  const box = <span class="gem-ico"><img src={gemIcon(icon)} alt="" loading="lazy" onLoad={layerIcon} onError={hideIcon} /></span> as HTMLSpanElement;
  if (!isSupport(id)) layer(box, gemIcon(icon));
  return box;
};

interface GemProps {
  id: string;
  /** Muestra lo que cuesta en el vendedor. */
  withCost?: boolean;
}

/** Una gema: <Gem id={id} withCost />. Marcarla la guarda como conseguida en este navegador. */
export const Gem: Component<GemProps, HTMLLabelElement> = ({ id, withCost }) => {
  const { name, attr, level } = GEMS[id];
  const isDone = doneStore.ids.has(id);
  // La misma gema sale en varios sitios (ruta, etapas, equipo…): marcarla en uno la marca en todos.
  const toggle = (e: Event) => {
    const on = (e.target as HTMLInputElement).checked;
    doneStore.set(id, on);
    document.querySelectorAll<HTMLLabelElement>(`label.gem[data-id="${id}"]`).forEach(label => {
      label.classList.toggle("done", on);
      label.querySelector("input")!.checked = on;
    });
  };
  return (
    <label class={"gem" + (isDone ? " done" : "")} data-id={id} onMouseenter={(e: MouseEvent) => showGemTip(id, e)} onMousemove={moveGemTip} onMouseleave={hideGemTip}>
      <input type="checkbox" checked={isDone} onChange={toggle} />
      <i class={attr} />
      <GemIcon id={id} />
      <span>{name}</span>
      <small>{`nv ${level}${withCost ? " · " + shortCost(level) : ""}`}</small>
      {suggested.has(id) && <em class="sug" title="Sugerencia automática de leveling: no está en tu build">sugerida</em>}
    </label>
  ) as HTMLLabelElement;
};
