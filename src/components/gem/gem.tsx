/* Una gema: su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */

import { cost, shortCurrency } from "../../js/cost";
import { GEMS } from "../../js/data";
import { gemIcon } from "../item-icon/item-icon";
import "./gem.css";

// Gemas de leveling sugeridas que no están en la build: se marcan como "sugerida" allí donde aparezcan.
export let suggested = new Set<string>();
/** Cambia las gemas sugeridas; lo llama el arranque al componer cada guía. */
export function setSuggested(ids: Set<string>): void { suggested = ids; }

// Gemas marcadas como conseguidas, por build; si el navegador no deja guardar, la guía funciona igual.
export const doneStore = {
  key: "", ids: new Set<string>(),
  /** Carga las marcadas de una build vista con una clase: cada combinación se guarda aparte. */
  load(cls: string, build: Build) {
    this.key = "poe-gemas:" + cls + ":" + build.gems.map(g => g.name).join("|");
    try { this.ids = new Set<string>(JSON.parse(localStorage.getItem(this.key) ?? "null") || []); } catch { this.ids = new Set<string>(); }
  },
  set(id: string, on: boolean) { on ? this.ids.add(id) : this.ids.delete(id); try { localStorage.setItem(this.key, JSON.stringify([...this.ids])); } catch {} },
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
const layerIcon = (e: Event) => {
  const img = e.target as HTMLImageElement;
  if (img.naturalWidth <= img.naturalHeight) return;
  img.parentElement!.style.backgroundImage = `url(${img.src}), url(${img.src})`;
  img.parentElement!.classList.add("layered");
};

interface GemProps {
  id: string;
  /** Muestra lo que cuesta en el vendedor. */
  withCost?: boolean;
}

/** Una gema: <Gem id={id} withCost />. Marcarla la guarda como conseguida en este navegador. */
export const Gem: Component<GemProps, HTMLLabelElement> = ({ id, withCost }) => {
  const { name, attr, level, icon } = GEMS[id];
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
    <label class={"gem" + (isDone ? " done" : "")} data-id={id}>
      <input type="checkbox" checked={isDone} onChange={toggle} />
      <i class={attr} />
      {icon && <span class="gem-ico"><img src={gemIcon(icon)} alt="" loading="lazy" onLoad={layerIcon} onError={hideIcon} /></span>}
      <span>{name}</span>
      <small>{`nv ${level}${withCost ? " · " + shortCost(level) : ""}`}</small>
      {suggested.has(id) && <em class="sug" title="Sugerencia automática de leveling: no está en tu build">sugerida</em>}
    </label>
  ) as HTMLLabelElement;
};
