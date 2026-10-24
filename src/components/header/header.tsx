/* Cabecera de la página: nombre y lema. */

/** Cabecera de la página. */
export const Header: Component<{}, HTMLElement> = () => (
  <header>
    <h1>Gemas de la Build</h1>
    <div class="sub">Path of Exile 1 · la campaña zona por zona, con las gemas de tu build en cada misión.</div>
  </header>
) as HTMLElement;
