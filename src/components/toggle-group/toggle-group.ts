/* Botonera de opciones excluyentes, como el modo y la etapa del mapa de calor. */

/** Botonera con un botón por opción [valor, etiqueta]; marca la pulsada y avisa con su valor. La primera empieza marcada. */
function toggleGroup(label: string, options: [value: string, text: string][], onPick: (value: string) => void): HTMLDivElement {
  const box = el("div", "modes");
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", label);
  for (const [value, text] of options) {
    const b = el("button", "", text);
    b.dataset.value = value;
    b.setAttribute("aria-pressed", String(!box.children.length));
    box.append(b);
  }
  box.addEventListener("click", e => {
    const b = (e.target as Element).closest("button"); if (!b) return;
    box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    onPick(b.dataset.value ?? "");
  });
  return box;
}
