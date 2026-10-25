/* El hueco del panel de gemas del acto: vacío y oculto hasta que act-gems-panel.tsx lo rellena. */

import "./act-gems.css";

/** El panel de gemas del acto (<aside>), en la página. */
export const ActGems: Component<{}, HTMLElement> = () => <aside id="act-gems" class="panel act-gems" aria-label="Gemas del acto" hidden /> as HTMLElement;
