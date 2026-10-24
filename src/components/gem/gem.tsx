/* Una gema: su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */

import { cost, shortCurrency } from "../../js/cost";
import { GEMS } from "../../js/data";
import "./gem.css";

// Gemas de leveling sugeridas que no están en la build: se marcan como "sugerida" allí donde aparezcan.
export let suggested = new Set<string>();
/** Cambia las gemas sugeridas; lo llama el arranque al componer cada guía. */
export function setSuggested(ids: Set<string>): void { suggested = ids; }

// Gemas marcadas como conseguidas, por build; si el navegador no deja guardar, la guía funciona igual.
export const doneStore = {
  key: "", ids: new Set<string>(),
  load(key: string) { this.key = key; try { this.ids = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "null") || []); } catch { this.ids = new Set<string>(); } },
  set(id: string, on: boolean) { on ? this.ids.add(id) : this.ids.delete(id); try { localStorage.setItem(this.key, JSON.stringify([...this.ids])); } catch {} },
};

const shortCost = (level: number): string => shortCurrency(cost(level));
/** Totales de moneda de unas compras, como texto: "2× Orb of Alteration, 1× Scroll of Wisdom". */
export function costText(ids: string[]): string {
  const total: Record<string, number> = {};
  ids.forEach(id => { const c = cost(GEMS[id].level); total[c] = (total[c] || 0) + 1; });
  return Object.entries(total).map(([c, n]) => `${n}× ${c}`).join(", ");
}

interface GemProps {
  id: string;
  /** Muestra lo que cuesta en el vendedor. */
  withCost?: boolean;
}

/** Una gema: <Gem id={id} withCost />. Marcarla la guarda como conseguida en este navegador. */
export const Gem: Component<GemProps, HTMLLabelElement> = ({ id, withCost }) => {
  const { name, attr, level } = GEMS[id];
  const isDone = doneStore.ids.has(id);
  const toggle = (e: Event) => {
    const box = e.target as HTMLInputElement;
    doneStore.set(id, box.checked);
    box.parentElement!.classList.toggle("done", box.checked);
  };
  return (
    <label class={"gem" + (isDone ? " done" : "")}>
      <input type="checkbox" checked={isDone} onChange={toggle} />
      <i class={attr} />
      <span>{name}</span>
      <small>{`nv ${level}${withCost ? " · " + shortCost(level) : ""}`}</small>
      {suggested.has(id) && <em class="sug" title="Sugerencia automática de leveling: no está en tu build">sugerida</em>}
    </label>
  ) as HTMLLabelElement;
};
