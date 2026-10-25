/* Lógica del índice sin DOM: cómo se agrupan los destinos en filas y cuál es la sección que se está leyendo. */

/** Una fila del índice: un destino suelto o un grupo de ellos (los actos van juntos), con los destinos anidados bajo el suelto. */
export interface TocRow { group: string | null; items: TocTarget[]; nested: TocTarget[] }

/**
 * Los destinos, en orden, como filas: los que tienen `parent` van anidados bajo él, y los que comparten `group` van juntos en una
 * fila, en el sitio de su primer miembro; el resto, una fila cada uno.
 */
export function tocRows(targets: TocTarget[]): TocRow[] {
  const rows: TocRow[] = [];
  for (const t of targets.filter(t => !t.parent)) {
    const row = t.group ? rows.find(r => r.group === t.group) : undefined;
    if (row) row.items.push(t); else rows.push({ group: t.group ?? null, items: [t], nested: targets.filter(n => n.parent === t.id) });
  }
  return rows;
}

/** Dónde está un destino de la página: su distancia al borde de arriba de la ventana. */
export interface TocPosition { id: string; top: number }

/**
 * La sección que se está leyendo: la última cuyo inicio ya pasó la línea `line` (px desde arriba) o, al final de la página, la que
 * se pulsó (`pinned`) si sigue a la vista: ahí ya no se puede desplazar más y la última sección nunca llegaría a la línea.
 */
export function currentSection(positions: TocPosition[], { line, atBottom, pinned, viewportHeight }: { line: number; atBottom: boolean; pinned?: TocPosition; viewportHeight: number }): string | null {
  if (atBottom && pinned && pinned.top < viewportHeight) return pinned.id;
  return positions.findLast(p => p.top <= line)?.id ?? null;
}
