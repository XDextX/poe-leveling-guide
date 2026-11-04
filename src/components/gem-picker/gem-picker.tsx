/* Selector de gema: un campo de texto con una lista que se filtra al escribir, con el dibujo y el nivel de cada gema. */

import { GEMS } from "../../js/data";
import { GemIcon } from "../gem/gem";
import "./gem-picker.css";

interface GemPickerProps {
  /** Las gemas entre las que se puede elegir. */
  ids: string[];
  /** La gema elegida ahora (vacío si ninguna). */
  value?: string | null;
  /** Texto accesible del campo. */
  label: string;
  /** Para devolver el foco al redibujar (data-field del campo). */
  field: string;
  /** Se llama con el id de la gema elegida, o "" si se vacía el campo. */
  onPick: (id: string) => void;
  /** Sin gema elegida el campo se vacía tras elegir (para añadir varias). */
  clearOnPick?: boolean;
}

// El editor devuelve el foco a un campo al redibujarse: eso no debe abrir la lista (se abriría justo tras elegir una gema).
let quiet = false;
/** Ejecuta `fn` (que da el foco a un campo) sin que el campo abra su lista. */
export function focusQuietly(fn: () => void): void { quiet = true; try { fn(); } finally { quiet = false; } }

// Cuántas gemas enseña la lista como máximo: con el campo vacío hay cientos.
const SHOWN = 40;

/** <GemPicker ids={…} value={id} label="Habilidad del tramo 1" field="skill" onPick={…} /> */
export const GemPicker: Component<GemPickerProps, HTMLSpanElement> = ({ ids, value, label, field, onPick, clearOnPick = false }) => {
  const byName = new Map(ids.map(id => [GEMS[id].name.toLowerCase(), id]));
  const listId = `gem-list-${Math.random().toString(36).slice(2)}`, errorId = listId + "-err";
  const error = <span class="field-error" id={errorId} role="alert" /> as HTMLElement;
  const list = <ul class="gem-options" id={listId} role="listbox" tabIndex={-1} hidden /> as HTMLUListElement;
  let active = -1;
  // Mientras el texto sea el de la gema elegida (aún sin tocar) la lista las enseña todas, no solo esa.
  let pristine = true;
  const input = <input type="text" role="combobox" aria-expanded="false" aria-controls={listId} aria-autocomplete="list" autocomplete="off"
    value={value ? GEMS[value].name : ""} placeholder="Nombre de la gema" aria-label={label} data-field={field} /> as HTMLInputElement;

  const matches = (): string[] => {
    const q = pristine ? "" : input.value.trim().toLowerCase();
    return ids.filter(id => !q || GEMS[id].name.toLowerCase().includes(q)).sort((a, b) => GEMS[a].name.localeCompare(GEMS[b].name)).slice(0, SHOWN);
  };
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const mark = () => {
    [...list.children].forEach((li, i) => { li.classList.toggle("active", i === active); li.setAttribute("aria-selected", String(i === active)); if (i === active) li.scrollIntoView({ block: "nearest" }); });
    if (active >= 0) input.setAttribute("aria-activedescendant", list.children[active].id); else input.removeAttribute("aria-activedescendant");
  };
  const open = () => {
    const found = matches();
    list.replaceChildren(...found.map((id, i) => (
      <li role="option" id={`${listId}-${i}`} aria-selected="false" data-id={id} onMousedown={(e: Event) => { e.preventDefault(); choose(id); }}><GemIcon id={id} /><span class="name">{GEMS[id].name}</span><small>nv {GEMS[id].level}</small></li>
    ) as HTMLElement));
    // Con el texto sin tocar la fila activa es la gema actual (si hay), no la primera: Enter no debe cambiarla sin querer.
    active = pristine ? (value ? found.indexOf(value) : -1) : found.length ? 0 : -1;
    list.hidden = !found.length; input.setAttribute("aria-expanded", String(!list.hidden)); mark();
  };
  function choose(id: string): void {
    error.textContent = ""; input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby");
    input.value = clearOnPick ? "" : GEMS[id].name;
    close();
    // Elegir la gema que ya había no cambia nada: avisar redibujaría el editor (y su foco) para nada.
    if (clearOnPick || id !== value) onPick(id);
  }
  /** Con lo escrito: la gema que se llama así, o el aviso de que no existe (sin borrar lo escrito). */
  function commit(): void {
    // Al redibujar el editor el campo viejo pierde el foco ya sin estar en la página: su "blur" no es del jugador.
    if (!input.isConnected) return;
    const text = input.value.trim(), id = byName.get(text.toLowerCase());
    if (!text) { if (value) onPick(""); return; }
    if (id) { choose(id); return; }
    input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", errorId);
    error.textContent = `No conozco una gema llamada «${text}».`;
  }

  input.addEventListener("input", () => { pristine = false; open(); });
  // Al entrar se selecciona lo escrito (en el siguiente turno: el clic pone el cursor antes), para que escribir sustituya la gema en
  // vez de añadirse al principio del texto, y se abre la lista. Si el campo ya tenía el foco no hay evento de foco: se abre con el ratón.
  input.addEventListener("focus", () => { pristine = true; setTimeout(() => input.select()); if (!quiet) open(); });
  input.addEventListener("mousedown", () => { if (list.hidden) open(); });
  input.addEventListener("blur", () => { close(); commit(); });
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    const rows = list.children.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.hidden) open(); else if (rows) { active = active < 0 ? (e.key === "ArrowDown" ? 0 : rows - 1) : (active + (e.key === "ArrowDown" ? 1 : -1) + rows) % rows; mark(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const id = !list.hidden && active >= 0 ? (list.children[active] as HTMLElement).dataset.id : undefined;
      if (id) choose(id); else commit();
    } else if (e.key === "Escape" && !list.hidden) { e.preventDefault(); close(); }
  });

  return <span class="gem-picker">{value && <GemIcon id={value} />}{input}{list}{error}</span> as HTMLSpanElement;
};
