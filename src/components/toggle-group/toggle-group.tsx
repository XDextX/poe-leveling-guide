/* Botonera de opciones excluyentes, como el modo y la etapa del mapa de calor. */

import "./toggle-group.css";

interface ToggleGroupProps {
  /** Clase que la identifica en la página (por ejemplo, para que la sesión la restaure). */
  className: string;
  /** Nombre del grupo para lectores de pantalla. */
  label: string;
  options: [value: string, text: string][];
  onPick: (value: string) => void;
}

/** Botonera con un botón por opción (su valor en data-value); marca la pulsada y avisa con su valor. La primera empieza marcada. */
export const ToggleGroup: Component<ToggleGroupProps, HTMLDivElement> = ({ className, label, options, onPick }) => {
  const pick = (e: MouseEvent) => {
    const b = (e.target as Element).closest("button"); if (!b) return;
    (e.currentTarget as Element).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    onPick(b.dataset.value ?? "");
  };
  return (
    <div class={"modes " + className} role="group" aria-label={label} onClick={pick}>
      {options.map(([value, text], i) => <button data-value={value} aria-pressed={String(i === 0)}>{text}</button>)}
    </div>
  ) as HTMLDivElement;
};
