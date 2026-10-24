/* "Qué hace": qué ofrece la guía, en texto para quien llega a la página (y para los buscadores). */

/** Explicación de la app. */
export const About: Component<{}, HTMLElement> = () => (
  <section class="panel about" aria-labelledby="about-title">
    <h2 id="about-title">Qué hace</h2>
    <p>Una guía de leveling para <b>Path of Exile 1</b> hecha a partir de tu build de <b>Path of Building</b>: pegas el código de exportación y te dice, zona por zona, cómo pasar la campaña con las gemas de tu build.</p>
    <ul>
      <li><b>Gemas por misión:</b> qué recompensa elegir al entregar cada misión y qué gemas comprar, a qué vendedor y cuánta moneda cuestan.</li>
      <li><b>Ruta de campaña</b> de los actos 1 a 10: zonas con su nivel recomendado, jefes, waypoints, pruebas de ascendencia, laberintos y recetas de crafteo.</li>
      <li><b>Leveling sugerido</b> cuando la build no lo trae: habilidad y soportes por tramo de nivel y un orden para el árbol de pasivas.</li>
      <li><b>Equipo y árbol:</b> los únicos de la build por nivel requerido, la prioridad de stats de los raros y un mapa de calor de daño y defensa del árbol.</li>
    </ul>
    <p class="note">Funciona sin conexión y gratis; tu build se lee en tu navegador y no se envía a ningún sitio.</p>
  </section>
) as HTMLElement;
