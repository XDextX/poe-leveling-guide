# PoE Leveling Guide

Guía de campaña para **Path of Exile 1** a partir de tu build de Path of Building: la ruta zona por zona, con las gemas de tu build en el momento exacto en que puedes conseguirlas.

Es un único archivo HTML. Funciona sin conexión y sin instalar nada: tu build se lee en el navegador y no se envía a ningún sitio.

## Cómo usarla

1. Abre `index.html` en el navegador.
2. En Path of Building: **Import/Export Build → Generate** y copia el código.
3. Pégalo en la app y pulsa **Crear guía**.

## Qué muestra

- **Ruta de campaña, actos 1 a 10**: zonas con su nivel recomendado, jefes, objetos de misión, waypoints, pruebas de ascendencia, laberintos y recetas de crafteo.
- **Gemas de tu build en cada misión**: qué recompensa elegir y qué comprar a cada vendedor, con su coste en moneda y el total que necesitas.
- **Gemas que no salen en la campaña**: Vaal, transfiguradas, despertadas y las que solo caen en drop, con cómo conseguirlas.
- **Equipo**: los únicos de la build ordenados por nivel requerido y qué stats se repiten en sus raros.
- **Árbol de pasivas**: stats sumadas, un mapa de calor de las zonas de daño y defensa y los puntos indispensables (keystones y notables).
- Opciones: inicio de liga, cambio de clase y casillas para marcar las gemas conseguidas (se guardan en tu navegador).

## Regenerar los datos

Los datos van dentro de `index.html`. Para actualizarlos a una liga nueva hace falta [Node.js](https://nodejs.org) 18 o superior:

```bash
node scripts/download-data.js
node scripts/build.js
```

`download-data.js` descarga los archivos a `data/` (una petición por segundo) y `build.js` los reduce y genera `index.html` a partir de `src/template.html`. La carpeta `data/` no se sube al repositorio.

## Fuentes

- **Ruta, zonas, misiones, recompensas, vendedores y gemas**: [exile-leveling](https://github.com/HeartofPhos/exile-leveling), de HeartofPhos (licencia MIT).
- **Árbol de pasivas**: [skilltree-export](https://github.com/grindinggear/skilltree-export), el export oficial de Grinding Gear Games.
- **Coste de las gemas en el vendedor**: tabla por nivel requerido tomada de [PoE-newleague](https://github.com/Blemming/PoE-newleague), de Blemming.
- **Formato de la build**: el código de exportación de [Path of Building](https://pathofbuilding.community/).

Qué recompensa elegir en cada misión, la clasificación de stats en daño y defensa (aproximada, por palabras clave), el mapa de calor y qué cuenta como punto indispensable son criterios de esta app, no datos oficiales. Los avisos de licencia de terceros están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Aviso

Path of Exile es una marca de Grinding Gear Games. Este proyecto no está afiliado a Grinding Gear Games ni a los autores de las herramientas citadas.

## Licencia

El código de este proyecto está bajo licencia [MIT](LICENSE).
