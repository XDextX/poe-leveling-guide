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

Hace falta [Node.js](https://nodejs.org) 22.18 o superior. La app se construye con [Vite](https://vite.dev):

```bash
npm install
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite (http://localhost:5173), con recarga en caliente al guardar. |
| `npm run build` | Genera la web en `dist/`: un solo `index.html` con todo el JS y el CSS dentro, la página ya escrita (prerender), `sitemap.xml` y lo que hay en `public/` (iconos y datos del juego). |
| `npm run serve` | Sirve el `dist/` ya generado (`vite preview`), como lo sirve GitHub Pages. |
| `npm run clean` | Borra `dist/`. |
| `npm run typecheck` | Comprueba los tipos con `tsc` en modo estricto (app, scripts y `vite.config.ts`) y que la lógica (`src/js/`) no importe la interfaz ni toque la página. |
| `npm run data` | Descarga los datos del juego a `data/` (una petición por segundo). |
| `npm run gamedata` | Reduce `data/` a `public/gamedata/`. |
| `npm run update-data` | Liga nueva: `data`, `gamedata` y `build` seguidos. |
| `npm run icons` | Vuelve a generar los iconos y la imagen para redes de `public/` (Windows). |

`dist/index.html` funciona también abierto con doble clic, sin servidor: el JS va dentro del propio HTML (`vite-plugin-singlefile`) y los datos se cargan con `<script src>`. Las carpetas `dist/`, `data/` y `node_modules/` no se suben al repositorio.

**Publicación:** en cada push a `main`, el workflow `.github/workflows/pages.yml` comprueba los tipos, ejecuta `npm run build` y publica `dist/` en GitHub Pages (en Settings → Pages, la fuente es "GitHub Actions"). No descarga nada: usa `public/gamedata/`, que va en el repositorio.

## Regenerar los datos

Los datos del juego van en `public/gamedata/`, un archivo por tipo, aparte del código de la app. Para actualizarlos a una liga nueva:

```bash
npm run update-data
```

`npm run update-data` equivale a `npm run data`, `npm run gamedata` y `npm run build` seguidos. `npm run data` descarga los archivos a `data/` (una petición por segundo) y `npm run gamedata` los reduce a `public/gamedata/`, junto con la fecha de descarga y la licencia de exile-leveling. Después hay que subir `public/gamedata/` al repositorio.

## Estructura

```
index.html            plantilla de Vite con tres huecos (el <head>, la página prerenderizada y los <script> de los datos) y src/main.tsx
vite.config.ts        build y servidor de desarrollo; su plugin "prerender" rellena los huecos de index.html
public/               lo que se copia tal cual a dist/
  gamedata/           los datos del juego reducidos (gems.js, campaign.js, tree.js, items.js), su fecha y la licencia de exile-leveling
  favicon.ico         el icono (16 a 256 px); dentro de la app va en SVG
  apple-touch-icon.png  el icono para la pantalla de inicio de iOS
  social-card.png     la imagen al compartir el enlace (Open Graph, 1200x630)
.github/workflows/    pages.yml: genera dist/ y la publica en GitHub Pages en cada push a main
src/
  types.d.ts          los tipos compartidos por la app y los scripts (y el JSX)
  styles.css          estilos base: tema, formulario, paneles
  icon.svg            el icono
  jsx/                el runtime del JSX: crea nodos DOM en el navegador y escribe HTML en el prerender
  js/                 lógica sin interfaz, un módulo por responsabilidad (no puede importar la interfaz ni tocar la página):
    data.ts           los datos del juego de la página (window.DATA), ya con nombre
    decode.ts         decodeGameData: los datos crudos a objetos con nombre (función pura, sirve también en Node)
    node-types.ts     tipos de nodo del árbol, compartidos con scripts/lib/tree.mts
    gems.ts           reglas sobre gemas (soporte o habilidad)
    cost.ts           coste de las gemas en el vendedor: la tabla, el precio y el texto de «Fuentes»
    errors.ts         errores con mensaje para el usuario
    pob.ts            leer el código de Path of Building
    route.ts          la ruta de campaña y sus marcas (y esc, para su HTML)
    plan.ts           qué gema se consigue en cada paso
    stats.ts          clasificación de stats en daño y defensa
    suggest.ts        el leveling sugerido
    guide.ts          la guía de una build, calculada (leveling, árboles, plan de gemas)
  main.tsx            punto de entrada: estilos base, comprobación de los datos y montaje de <App>
  app/                la app
    app.tsx           <App>: la página con sus eventos y la build leída; compone la guía al leerla o al cambiar una opción
    guard.ts          si faltan los datos del juego, lo avisa y para (main.tsx lo importa antes que la app)
    session.ts        conservar la build y la vista al recargar
    document.tsx      <Head> y el prerender que usa vite.config.ts
  components/         interfaz: una carpeta por componente, con su .tsx y, si tiene estilos, su .css (ver «Componentes»)
    page/             la página entera
    header/           la cabecera
    build-form/       el formulario de la build
    toc-nav/          el índice y su botón (vacíos hasta que hay guía)
    about/            «Qué hace»
    sources/          «Fuentes»
    guide/            la guía entera de una build (sus secciones)
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
    toc/              la lógica del índice (enlaces, sección actual, desplazamiento)
tsconfig.json         tipos de la app (navegador)
scripts/
  tsconfig.json       tipos de los scripts (Node) y de vite.config.ts
  download-data.mts   descarga los datos a data/
  gamedata.mts        reduce los datos de data/ a public/gamedata/
  check-layers.mts    falla si src/js/ importa algo de la interfaz o toca la página (document, window, localStorage)
  icons.ps1           genera los iconos y la imagen para redes de public/ (Windows)
  lib/                un reductor por fuente de datos, gamedata/ y los datos del sitio (site.mts: URL, descripción, JSON-LD, sitemap)
```

**Cómo se genera la página:** la página entera son componentes. En el build, el plugin `prerender` de `vite.config.ts` ejecuta `src/app/document.tsx` en Node (con `ssrLoadModule` de Vite) y escribe el `<head>` y `<Page>` ya en HTML dentro de `index.html`, así los buscadores, las previsualizaciones y quien no tiene JavaScript ven el contenido. En el navegador, `main.tsx` monta `<App>`, que vuelve a crear `<Page>` con sus eventos, en lugar de la prerenderizada, que es idéntica.

## Componentes

Los componentes se escriben en JSX, como en React o Solid, pero sin librería: el runtime de `src/jsx/` crea nodos DOM reales, sin Virtual DOM ni redibujado. Cada componente es una función con nombre en PascalCase que recibe sus props y devuelve DOM; sus props tienen su propia interfaz, `<Nombre>Props`, y se declara con el tipo `Component` (de `src/types.d.ts`). Cada archivo importa lo que usa:

```tsx
// src/components/badge/badge.tsx
import "./badge.css";

interface BadgeProps {
  /** Resaltada con el color de acento. */
  strong?: boolean;
  children: JSX.Child;
}

/** Etiqueta pequeña. */
export const Badge: Component<BadgeProps, HTMLSpanElement> = ({ strong = false, children }) =>
  <span class={strong ? "badge strong" : "badge"}>{children}</span> as HTMLSpanElement;
```

```tsx
// Uso, desde otro componente:
import { Badge } from "../badge/badge";

<Section title="Equipo" className="act gear">
  <Badge strong>nuevo</Badge>
</Section>
```

- **Props comprobadas:** TypeScript revisa las props dentro del JSX: una prop que no existe o una obligatoria que falta es un error en `npm run typecheck`.
- **Sin importar `h`:** el JSX usa el runtime automático (`jsxImportSource`), así que no hace falta importar nada para escribir JSX.
- **Diferencias con React:** se escribe `class` (no `className`); los eventos son `onClick`, `onChange`, `onMousemove`… (nombre del evento del DOM tras `on`); `html` pone HTML sin escapar, solo para HTML que genera la propia app. El texto entre etiquetas o en `{…}` siempre va como texto, nunca como HTML.
- **Sin estado reactivo ni redibujado:** un componente se ejecuta una vez y devuelve DOM. `<App>` (`src/app/app.tsx`) guarda la build leída en una variable propia y, cuando algo cambia, vuelve a componer la guía: la calcula `buildGuide` (`src/js/guide.ts`) y la dibuja `<Guide>`; el mapa de calor modifica su DOM directamente. Lo que necesita la página ya montada (el índice, la sesión) lo hace `<App>` en un `queueMicrotask`, el equivalente a un `useEffect`.
- **Tipo de una expresión JSX:** es `Node`; si necesitas el elemento concreto, afínalo con `as` (`<canvas /> as HTMLCanvasElement`).
- **Componentes y ayudantes:** `Component<Props, Devuelve>` devuelve un elemento o un `DocumentFragment` (`View`), o `| null` si a veces no hay nada que mostrar. Las demás funciones de `src/components/` (`placeTip`, `uniqueIcon`, `drawHeat`, `heatControls`…) son ayudantes, no componentes.
- **Prerender:** los componentes de la página (`page/` y los que usa) se ejecutan también en Node, así que no pueden tocar `document` ni `window` al crearse ni al importarse; los eventos sí, porque solo se ejecutan en el navegador.
- **Capas:** la lógica (`src/js/`) no importa componentes, ni `src/app/`, ni el runtime del JSX, ni toca la página (`document`, `localStorage`, `window` salvo `window.DATA`); `npm run typecheck` lo comprueba con `scripts/check-layers.mts`.

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
