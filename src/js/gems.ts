/* Reglas sobre las gemas del juego. */

import { GEMS, SKILLS } from "./data";

/** Gema de soporte: lleva "Support" en el nombre o tiene tipos de habilidad a los que puede apoyar (Enlighten o Lifetap no tienen ninguno). */
export const isSupport = (id: string): boolean => !!GEMS[id]?.name.endsWith(" Support") || (SKILLS[id]?.allowed.length ?? 0) > 0;
/** Gema de habilidad: conocida y no de soporte. */
export const isActive = (id: string): boolean => !!SKILLS[id] && !isSupport(id);

/** Para qué sirve una habilidad al subir de nivel, de más a menos importante: supervivencia, daño o comodidad. */
export type SkillKind = "survival" | "damage" | "qol";
export const SKILL_KINDS: SkillKind[] = ["survival", "damage", "qol"];
// Auras y habilidades defensivas conocidas: las etiquetas de RePoE no dicen si un aura protege o hace daño, así que va por nombre.
const SURVIVAL_RE = /^(Vaal )?(Determination|Grace|Discipline|Vitality|Steelskin|Immortal Call|Molten Shell|Enduring Cry|Flesh and Stone|Arctic Armour|Blood and Sand|Convocation|Purity of )/;
const QOL_RE = /^(Vaal )?(Clarity|Portal|Haste$)/;
/** Clasifica una habilidad: defensiva (guard y las auras de arriba), de comodidad (movimiento, viaje, Clarity) o, si no, de daño. */
export function skillKind(id: string): SkillKind {
  const name = GEMS[id]?.name ?? "", tags = SKILLS[id]?.tags ?? [];
  if (tags.includes("guard") || SURVIVAL_RE.test(name)) return "survival";
  if (tags.some(t => ["movement", "travel", "blink"].includes(t)) || QOL_RE.test(name)) return "qol";
  return "damage";
}
