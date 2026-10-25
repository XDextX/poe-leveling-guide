/* Ayudantes de las pruebas: builds hechas a mano (sin pasar por el código de PoB) y gemas por su nombre. */

import { GEMS } from "../src/js/data";

/** Id de una gema por su nombre exacto; falla si no existe, para que una prueba no pase por accidente. */
export function gemId(name: string): string {
  const id = Object.keys(GEMS).find(k => GEMS[k].name === name);
  if (!id) throw new Error(`No existe la gema "${name}" en los datos`);
  return id;
}

/** Una build mínima: Marauder, sin gemas, sin equipo y sin árbol; `over` cambia lo que haga falta. */
export const build = (over: Partial<Build> = {}): Build => ({
  cls: "Marauder", ascend: null, bandit: "None", gems: [], items: [],
  tree: { nodes: [], masteries: [], classId: null, stages: [] }, main: null, groups: [], notes: "", stats: {}, ...over,
});
