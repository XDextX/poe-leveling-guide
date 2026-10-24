# PoE Leveling Guide

Guía de campaña para **Path of Exile 1** a partir de tu build de Path of Building: la ruta zona por zona, con las gemas de tu build en el momento exacto en que puedes conseguirlas.

Es una página HTML con sus datos al lado, en `gamedata/`. Funciona sin conexión y sin instalar nada: tu build se lee en el navegador y no se envía a ningún sitio.

## Cómo usarla

1. Usa la web publicada o, en local, genera la app con `npm run build` y abre `dist/index.html` en el navegador. Si la copias a otro sitio, copia la carpeta `dist/` entera: `index.html` necesita `gamedata/` a su lado.
2. En Path of Building: **Import/Export Build → Generate** y copia el código.
3. Pégalo en la app y pulsa **Crear guía**.

## Qué muestra

- **Ruta de campaña, actos 1 a 10**: zonas con su nivel recomendado, jefes, objetos de misión, waypoints, pruebas de ascendencia, laberintos y recetas de crafteo.
- **Gemas de tu build en cada misión**: qué recompensa elegir y qué comprar a cada vendedor, con su coste en moneda y el total que necesitas.
- **Gemas que no salen en la campaña**: Vaal, transfiguradas, despertadas y las que solo caen en drop, con cómo conseguirlas.
- **Leveling sugerido** (cuando la build no trae cómo subir): por tramos de la campaña, una habilidad parecida a la tuya que tu clase puede conseguir a ese nivel, soportes compatibles con ella (primero los de tu build) y un orden para coger los nodos de tu árbol final. Va siempre marcado como **sugerencia automática**: lo calcula la app, no es la guía del autor de la build. Si la build trae árboles de leveling, se usan esos.
- **Equipo**: los únicos de la build con su icono, ordenados por nivel requerido, y qué stats se repiten en sus raros. Los iconos se cargan del CDN de GGG: sin conexión no aparecen.
- **Árbol de pasivas**: stats sumadas, un mapa de calor de las zonas de daño y defensa y los puntos indispensables (keystones y notables). El mapa se puede arrastrar y ampliar (Ctrl+rueda, pellizco o botones), y al pasar el ratón o tocar un nodo muestra su icono, sus stats, si está cogido y, en las maestrías, el efecto elegido. Los iconos se cargan del CDN de GGG: sin conexión no aparecen.
- **Índice** con desplazamiento suave y la sección actual resaltada: fijo al lado de la guía en pantallas anchas y, en el celular, en un botón flotante que lo abre como panel.
- **Recargar no pierde nada:** la build, las opciones, lo que tienes desplegado, el mapa de calor y la posición de lectura se guardan en tu navegador y vuelven al recargar. Vaciar el campo y pulsar Crear guía lo borra.
- Opciones: inicio de liga, mostrar u ocultar las actividades de zona (oculto, la ruta queda solo con los pasos con gemas), cambio de clase y casillas para marcar las gemas conseguidas (se guardan en tu navegador).

## Generar la app

Hace falta [Node.js](https://nodejs.org) 22.18 o superior, que ejecuta TypeScript directamente:

```bash
npm install
npm run build
npm run typecheck
```

`npm run build` genera la web en `dist/`: junta `src/` en `index.html` y copia los datos de `gamedata/` y los archivos de `public/`. `npm run typecheck` comprueba los tipos con `tsc` en modo estricto, sin generar nada. Las carpetas `dist/`, `data/` y `node_modules/` no se suben al repositorio.

**Publicación:** en cada push a `main`, el workflow `.github/workflows/pages.yml` comprueba los tipos, ejecuta `npm run build` y publica `dist/` en GitHub Pages (en Settings → Pages, la fuente es "GitHub Actions"). No descarga nada: usa `gamedata/`, que va en el repositorio.

## Regenerar los datos

Los datos del juego van en `gamedata/`, un archivo por tipo, aparte del código de la app. Para actualizarlos a una liga nueva:

```bash
npm run data
npm run gamedata
npm run build
```

`npm run data` descarga los archivos a `data/` (una petición por segundo) y `npm run gamedata` los reduce a `gamedata/`, junto con la fecha de descarga y la licencia de exile-leveling. Después hay que subir `gamedata/` al repositorio.

## Estructura

```
dist/                 la web generada por npm run build (no va en el repositorio): index.html, gamedata/, public/ y sitemap.xml
gamedata/             los datos del juego reducidos (gems.js, campaign.js, tree.js, items.js), su fecha y la licencia de exile-leveling
public/               archivos que se copian tal cual a dist/
  favicon.ico         el icono (16 a 256 px); dentro de la app va en SVG
  apple-touch-icon.png  el icono para la pantalla de inicio de iOS
  social-card.png     la imagen al compartir el enlace (Open Graph, 1200x630)
.github/workflows/    pages.yml: genera dist/ y la publica en GitHub Pages en cada push a main
src/
  index.html          el marcado de la página
  types.d.ts          los tipos compartidos por la app y los scripts
  styles.css          estilos base: tema, formulario, paneles
  icon.svg            el icono
  js/                 lógica sin interfaz, un módulo por responsabilidad:
    dom.ts            utilidades del DOM: $, esc y el (crear elementos con texto seguro)
    data.ts           los datos con nombre de campo y utilidades comunes
    pob.ts            leer el código de Path of Building
    route.ts          la ruta de campaña y sus marcas
    plan.ts           qué gema se consigue en cada paso
    stats.ts          clasificación de stats en daño y defensa
    suggest.ts        el leveling sugerido
    session.ts        conservar la build y la vista al recargar
    app.ts            arranque: compone la guía con los componentes
  components/         interfaz: una carpeta por componente, con su TS y, si tiene estilos, su CSS
    section/          sección desplegable y subtítulos (la base de las demás)
    named-list/       lista de pares nombre/texto
    toggle-group/     botonera de opciones excluyentes
    float-tip/        colocar una ficha flotante sin salirse de la pantalla
    summary/          resumen de gemas, bandidos y moneda
    gem/              una gema con su casilla y su coste
    gem-line/         líneas y bloques de gemas
    route/            la ruta acto por acto
    other-ways/       gemas que no salen en la ruta
    leveling/         sección del leveling sugerido
    stage-card/       tarjeta de un tramo del leveling
    gear/             sección del equipo
    unique-table/     tabla de únicos con icono
    unique-tip/       ficha de un único al estilo del juego
    item-icon/        icono de un único (CDN de GGG)
    rare-stats/       prioridad de stats de los raros
    tree/             sección del árbol de pasivas
    tree-stats/       stats sumadas del árbol
    heat-panel/       panel del mapa de calor con sus botoneras
    heatmap/          dibujo del mapa de calor
    heat-controls/    mover, zoom y ficha del nodo en el mapa
    node-tip/         ficha de un nodo del árbol
    node-icon/        icono de un nodo (CDN de GGG)
    key-nodes/        puntos indispensables
    tree-extras/      ascendencia y maestrías
    toc/              el índice
tsconfig.json         tipos de la app (navegador)
scripts/
  tsconfig.json       tipos de los scripts (Node)
  download-data.mts   descarga los datos a data/
  gamedata.mts        reduce los datos de data/ a gamedata/
  icons.ps1           genera los iconos y la imagen para redes de public/ (Windows)
  build.mts           genera dist/: index.html, sitemap.xml y la copia de gamedata/ y public/
  lib/                un reductor por fuente de datos, el empaquetado y los datos del sitio (site.mts: URL, descripción, JSON-LD)
```

Todo comparte un único `<script>` y un único `<style>`, así que no hace falta empaquetador: `scripts/lib/bundle.mts` quita los tipos con `stripTypeScriptTypes` de Node y concatena la lógica (`MODULES`, en orden), todas las carpetas de `components/` (en orden alfabético: cada componente solo define funciones y solo da estilo a sus propias clases, así que el orden no importa) y por último `app.ts`. Por eso solo vale TypeScript que se borra sin más (`erasableSyntaxOnly`): nada de `enum` ni `namespace`.

## Fuentes

- **Ruta, zonas, misiones, recompensas, vendedores y gemas**: [exile-leveling](https://github.com/HeartofPhos/exile-leveling), de HeartofPhos (licencia MIT).
- **Árbol de pasivas**: [skilltree-export](https://github.com/grindinggear/skilltree-export), el export oficial de Grinding Gear Games.
- **Etiquetas, tipos y compatibilidad de soportes de las gemas, e iconos de los únicos**: [RePoE](https://github.com/repoe-fork/repoe-fork) (licencia MIT; los datos en sí son de Grinding Gear Games).
- **Coste de las gemas en el vendedor**: tabla por nivel requerido tomada de [PoE-newleague](https://github.com/Blemming/PoE-newleague), de Blemming.
- **Formato de la build**: el código de exportación de [Path of Building](https://pathofbuilding.community/).

Qué recompensa elegir en cada misión, la clasificación de stats en daño y defensa (aproximada, por palabras clave), el mapa de calor, qué cuenta como punto indispensable y todo el leveling sugerido son criterios de esta app, no datos oficiales. Los avisos de licencia de terceros están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Aviso

Path of Exile es una marca de Grinding Gear Games. Este proyecto no está afiliado a Grinding Gear Games ni a los autores de las herramientas citadas.

## Licencia

El código de este proyecto está bajo licencia [MIT](LICENSE).
