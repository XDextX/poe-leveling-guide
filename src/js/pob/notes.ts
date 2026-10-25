/* Las notas del autor de una build de Path of Building (<Notes>): texto libre con sus códigos de color, que aquí se quitan. */

// Los colores de PoB: ^7 (uno de los diez de la paleta) y ^xRRGGBB.
const COLOR_CODES = /\^x[0-9a-fA-F]{6}|\^\d/g;

/** El texto de <Notes>, sin códigos de color, con saltos de línea normales y sin espacios sobrantes; "" si no hay. */
export function parseNotes(doc: Document): string {
  return (doc.querySelector("PathOfBuilding > Notes")?.textContent ?? "").replace(COLOR_CODES, "").replace(/\r\n?/g, "\n").trim();
}

// Palabras con que un autor habla de subir de nivel: leveling, leveleo, lvl, "act 1", campaña…
const LEVELING = /level(?:l?ing|eo)|\blvl\b|\bact(?:o)?\s*\d|campaign|campa[ñn]a/i;

/** Si las notas hablan de cómo subir de nivel (es una pista, no una garantía). */
export const mentionsLeveling = (notes: string): boolean => LEVELING.test(notes);
