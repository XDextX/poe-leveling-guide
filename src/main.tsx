/* Punto de entrada: estilos base, comprobación de los datos y montaje de <App> en lugar de la página prerenderizada. */

// Estilos base (tema, formulario, paneles); cada componente importa los suyos.
import "./styles.css";
// Antes que la app: si faltan los datos del juego, avisa y para antes de que los use ningún módulo.
import "./app/guard";
import { App } from "./app/app";

document.querySelector("main")!.replaceWith(<App />);
