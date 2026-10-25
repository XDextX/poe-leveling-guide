/* Una frase corta que dice para qué sirve una habilidad, hecha con sus etiquetas y las armas que pide. Es automática y a veces tosca. */

import { SKILLS } from "./data";

// Las etiquetas que merece la pena decir, por orden de importancia.
const TAG_ES: [tag: string, es: string][] = [
  ["poison", "veneno"], ["ignite", "ignite"], ["bleed", "sangrado"], ["physical", "físico"], ["fire", "fuego"], ["cold", "frío"],
  ["lightning", "rayo"], ["chaos", "caos"], ["melee", "cuerpo a cuerpo"], ["projectile", "proyectil"], ["spell", "hechizo"], ["area", "área"],
];
const WEAPON_ES: Record<string, string> = {
  Claw: "garras", Dagger: "dagas", "Rune Dagger": "dagas rúnicas", "One Hand Sword": "espadas de una mano", "Two Hand Sword": "espadas a dos manos",
  "Thrusting One Hand Sword": "espadas de estocada", "One Hand Axe": "hachas de una mano", "Two Hand Axe": "hachas a dos manos", "One Hand Mace": "mazas de una mano",
  "Two Hand Mace": "mazas a dos manos", Staff: "bastones", Warstaff: "bastones de guerra", Bow: "arcos", Wand: "varitas", Sceptre: "cetros", Unarmed: "sin arma",
};
// Si una habilidad vale con muchas armas, decirlas no aporta: solo se avisa cuando la restricción es real.
const MAX_WEAPONS_TO_SAY = 4;

/** Frase como "veneno, cuerpo a cuerpo · solo dagas, garras" para una habilidad. */
export function reasonOf(id: string): string {
  const skill = SKILLS[id];
  if (!skill) return "";
  const tags = TAG_ES.filter(([tag]) => skill.tags.includes(tag)).slice(0, 3).map(([, es]) => es);
  const weapons = [...new Set(skill.weapons.map(w => WEAPON_ES[w] ?? w))];
  const only = skill.weapons.length > 0 && weapons.length <= MAX_WEAPONS_TO_SAY ? `solo ${weapons.join(", ")}` : "";
  return [tags.join(", "), only].filter(Boolean).join(" · ");
}
