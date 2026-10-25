/* Las estadísticas que Path of Building guarda en el código de exportación: lo que ya calculó su motor (DPS, vida, resistencias…). */

/** Las <PlayerStat stat="TotalDPS" value="46556.8"/> de la build, como número; las que no lo son se ignoran. */
export function parseStats(doc: Document): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const el of doc.querySelectorAll("Build > PlayerStat")) {
    const key = el.getAttribute("stat"), value = Number(el.getAttribute("value"));
    if (key && Number.isFinite(value)) stats[key] = value;
  }
  return stats;
}
