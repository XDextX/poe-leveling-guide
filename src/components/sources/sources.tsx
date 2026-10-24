/* Fuentes de los datos, con la fecha de descarga y la licencia de exile-leveling. */

interface SourcesProps {
  /** Fecha en que se descargaron los datos (AAAA-MM-DD). */
  date: string;
  /** Texto de la licencia de exile-leveling. */
  license: string;
}

/** De dónde sale cada dato y qué decide la propia app. */
export const Sources: Component<SourcesProps, HTMLElement> = ({ date, license }) => (
  <section class="panel sources" id="fuentes" data-toc="Fuentes">
    <h2>Fuentes</h2>
    <p class="note">Todo se descargó una vez, el {date}, y va con la app (en la carpeta gamedata/): funciona sin conexión y no envía tu build a ningún sitio.</p>
    <dl>
      <dt>Ruta de campaña, zonas, misiones, recompensas, vendedores y gemas</dt>
      <dd><a href="https://github.com/HeartofPhos/exile-leveling">exile-leveling</a>, de HeartofPhos (licencia MIT). Las notas de cada zona están en inglés, como en el original; aquí solo se traducen los verbos con que empiezan los pasos.</dd>
      <dt>Árbol de pasivas</dt>
      <dd><a href="https://github.com/grindinggear/skilltree-export">skilltree-export</a>, el export oficial de Grinding Gear Games: posiciones, stats, conexiones y maestrías de cada nodo.</dd>
      <dt>Etiquetas, tipos y compatibilidad de soportes de las gemas</dt>
      <dd><a href="https://github.com/repoe-fork/repoe-fork">RePoE</a> (licencia MIT), un volcado de los datos del juego; los datos en sí son de Grinding Gear Games. Se usan para las sugerencias de leveling.</dd>
      <dt>Coste de las gemas en el vendedor</dt>
      <dd>Tabla por nivel requerido tomada de <a href="https://github.com/Blemming/PoE-newleague">PoE-newleague</a>, de Blemming (menos de 8: Wisdom; 8-15: Transmutation; 16-27: Alteration; 28-37: Chance; 38 o más: Alchemy).</dd>
      <dt>Tu build</dt>
      <dd>El código de exportación de <a href="https://pathofbuilding.community/">Path of Building</a>, que se descomprime en tu navegador: clase, gemas, equipo y árbol salen de ahí.</dd>
      <dt>Criterios propios de esta app</dt>
      <dd>Qué recompensa elegir en cada misión, la clasificación de stats en daño, defensa y otros (por palabras clave, aproximada), el mapa de calor, qué cuenta como punto indispensable (keystones y notables) y todo el leveling sugerido (habilidad, soportes y orden del árbol por tramos) son decisiones de esta app, no datos oficiales.</dd>
    </dl>
    <p class="note">Path of Exile es una marca de Grinding Gear Games. Esta app no está afiliada a GGG ni a los autores de las herramientas citadas.</p>
    <details class="note"><summary>Licencia de exile-leveling</summary><pre>{license}</pre></details>
  </section>
) as HTMLElement;
