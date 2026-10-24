// Únicos de RePoE reducidos a la ruta de su icono en el CDN de GGG.

/** Lo que leemos de uniques.min.json de RePoE. */
export interface RepoeUnique {
  name: string; inventory_width: number; inventory_height: number; is_alternate_art: boolean;
  visual_identity: { dds_file: string };
}

/** Nombre → [ruta del arte sin "Art/" ni extensión, ancho, alto]; el arte alternativo no cuenta. */
export function reduceUniques(src: Record<string, RepoeUnique>): Record<string, UniqueRow> {
  const U: Record<string, UniqueRow> = {};
  for (const u of Object.values(src)) {
    if (u.is_alternate_art || U[u.name]) continue;
    U[u.name] = [u.visual_identity.dds_file.replace(/^Art\//, "").replace(/\.dds$/, ""), u.inventory_width, u.inventory_height];
  }
  return U;
}
