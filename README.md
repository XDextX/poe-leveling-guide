# PoE Leveling Guide

Guía de campaña para **Path of Exile 1** a partir de tu build de Path of Building: la ruta zona por zona, con las gemas de tu build en el momento exacto en que puedes conseguirlas.

Es una página HTML con sus datos al lado, en `gamedata/`. Funciona sin conexión y sin instalar nada: tu build se lee en el navegador y no se envía a ningún sitio.

## Cómo usarla

1. Abre `index.html` en el navegador. Si la copias a otro sitio, copia la carpeta entera: `index.html` necesita `gamedata/` a su lado.
2. En Path of Building: **Import/Export Build → Generate** y copia el código.
3. Pégalo en la app y pulsa **Crear guía**.

## Qué muestra

- **Ruta de campaña, actos 1 a 10**: zonas con su nivel recomendado, jefes, objetos de misión, waypoints, pruebas de ascendencia, laberintos y recetas de crafteo.
- **Gemas de tu build en cada misión**: qué recompensa elegir y qué comprar a cada vendedor, con su coste en moneda y el total que necesitas.
- **Gemas que no salen en la campaña**: Vaal, transfiguradas, despertadas y las que solo caen en drop, con cómo conseguirlas.
- **Leveling sugerido** (cuando la build no trae cómo subir): por tramos de la campaña, una habilidad parecida a la tuya que tu clase puede conseguir a ese nivel, soportes compatibles con ella (primero los de tu build) y un orden para coger los nodos de tu árbol final. Va siempre marcado como **sugerencia automática**: lo calcula la app, no es la guía del autor de la build. Si la build trae árboles de leveling, se usan esos.
- **Equipo**: los únicos de la build ordenados por nivel requerido y qué stats se repiten en sus raros.
- **Árbol de pasivas**: stats sumadas, un mapa de calor de las zonas de daño y defensa y los puntos indispensables (keystones y notables).
- **Índice** con desplazamiento suave y la sección actual resaltada: fijo al lado de la guía en pantallas anchas y, en el celular, en un botón flotante que lo abre como panel.
- Opciones: inicio de liga, mostrar u ocultar las actividades de zona (oculto, la ruta queda solo con los pasos con gemas), cambio de clase y casillas para marcar las gemas conseguidas (se guardan en tu navegador).

## Regenerar los datos

Los datos van en `gamedata/`, un archivo por tipo, aparte del código de la app. Para actualizarlos a una liga nueva hace falta [Node.js](https://nodejs.org) 18 o superior:

```bash
node scripts/download-data.js
node scripts/build.js
```

`download-data.js` descarga los archivos a `data/` (una petición por segundo) y `build.js` los reduce a `gamedata/` y junta `src/` en `index.html`. La carpeta `data/` no se sube al repositorio.

## Estructura

```
index.html            la app generada, sin dependencias
gamedata/             los datos del juego, generados: gems.js, campaign.js y tree.js
favicon.ico           el icono (16 a 256 px); dentro de la app va en SVG
apple-touch-icon.png  el icono para la pantalla de inicio de iOS
social-card.png       la imagen al compartir el enlace (Open Graph, 1200x630)
sitemap.xml           para enviar la página a Google Search Console
src/
  index.html          el marcado de la página
  styles.css          estilos base: tema, formulario, paneles
  icon.svg            el icono
  js/                 lógica sin interfaz, un módulo por responsabilidad:
    data.js           los datos con nombre de campo y utilidades comunes
    pob.js            leer el código de Path of Building
    route.js          la ruta de campaña y sus marcas
    plan.js           qué gema se consigue en cada paso
    stats.js          clasificación de stats en daño y defensa
    suggest.js        el leveling sugerido
    app.js            arranque: compone la guía con los componentes
  components/         interfaz: cada componente con su JS y su CSS
    section/          sección desplegable (la base de las demás)
    summary/          resumen de gemas, bandidos y moneda
    gem/              gema con casilla, líneas de gemas y costes
    route/            la ruta acto por acto
    other-ways/       gemas que no salen en la ruta
    gear/             únicos y prioridad de stats del equipo
    leveling/         tarjetas del leveling sugerido
    heatmap/          el mapa de calor
    tree/             stats del árbol, mapa por etapas e indispensables
    toc/              el índice
scripts/
  download-data.js    descarga los datos a data/
  icons.ps1           genera favicon.ico, apple-touch-icon.png y social-card.png (Windows)
  build.js            reduce los datos a gamedata/ y genera index.html
  lib/                un reductor por fuente de datos, el empaquetado y los datos del sitio (site.js: URL, descripción, JSON-LD)
```

Todo comparte un único `<script>` y un único `<style>`, así que no hacen falta herramientas de compilación: `scripts/lib/bundle.js` concatena la lógica (`MODULES`), los componentes (`COMPONENTS`, que también fija el orden del CSS) y por último `app.js`.

## Fuentes

- **Ruta, zonas, misiones, recompensas, vendedores y gemas**: [exile-leveling](https://github.com/HeartofPhos/exile-leveling), de HeartofPhos (licencia MIT).
- **Árbol de pasivas**: [skilltree-export](https://github.com/grindinggear/skilltree-export), el export oficial de Grinding Gear Games.
- **Etiquetas, tipos y compatibilidad de soportes de las gemas**: [RePoE](https://github.com/repoe-fork/repoe-fork) (licencia MIT; los datos en sí son de Grinding Gear Games).
- **Coste de las gemas en el vendedor**: tabla por nivel requerido tomada de [PoE-newleague](https://github.com/Blemming/PoE-newleague), de Blemming.
- **Formato de la build**: el código de exportación de [Path of Building](https://pathofbuilding.community/).

Qué recompensa elegir en cada misión, la clasificación de stats en daño y defensa (aproximada, por palabras clave), el mapa de calor, qué cuenta como punto indispensable y todo el leveling sugerido son criterios de esta app, no datos oficiales. Los avisos de licencia de terceros están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Aviso

Path of Exile es una marca de Grinding Gear Games. Este proyecto no está afiliado a Grinding Gear Games ni a los autores de las herramientas citadas.

## Licencia

El código de este proyecto está bajo licencia [MIT](LICENSE).
