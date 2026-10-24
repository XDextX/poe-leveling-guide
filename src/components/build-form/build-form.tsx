/* Formulario de la build: el código de Path of Building, la clase y las opciones de la guía. */

interface BuildFormProps {
  /** Clases del juego, para el desplegable. */
  classes: string[];
  /** Al pulsar "Crear guía". */
  onBuild?: () => void;
  /** Al cambiar la clase o una de las casillas. */
  onOptionsChange?: () => void;
}

/**
 * Formulario de la build. Los controles llevan id (code, cls, league, zones, go, msg) porque el resto de la app los lee
 * por id (`form` en src/js/data.ts y la sesión).
 */
export const BuildForm: Component<BuildFormProps, HTMLElement> = ({ classes, onBuild, onOptionsChange }) => (
  <section class="panel">
    <label class="field">Código de Path of Building
      <textarea id="code" spellcheck="false" placeholder="Pega aquí el código de exportación de Path of Building (Import/Export Build → Generate)" />
    </label>
    <div class="row">
      <label class="field">Clase <select id="cls" onChange={onOptionsChange}>{classes.map(c => <option value={c}>{c}</option>)}</select></label>
      <label class="check"><input type="checkbox" id="league" checked onChange={onOptionsChange} /> Inicio de liga</label>
      <label class="check"><input type="checkbox" id="zones" checked onChange={onOptionsChange} /> Actividades de zona</label>
      <button class="primary" id="go" onClick={onBuild}>Crear guía</button>
    </div>
    <div id="msg" aria-live="polite" />
    {/* Como HTML y no como JSX: así queda igual que si el navegador lo leyera de la página (con JavaScript, es solo texto). */}
    <noscript html={`<p class="note">La guía necesita JavaScript activado en el navegador.</p>`} />
  </section>
) as HTMLElement;
