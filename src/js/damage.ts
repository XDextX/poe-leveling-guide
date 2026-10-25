/* La forma de daño de una build (física, fuego, frío, rayo, caos), aproximada, para que las sugerencias de leveling no mezclen elementos. */

import { GEMS, NODES, SKILLS } from "./data";

export type Element = "physical" | "fire" | "cold" | "lightning" | "chaos";
export const ELEMENTS: Element[] = ["physical", "fire", "cold", "lightning", "chaos"];
/** Cuánto pesa cada elemento en una build: cuanto mayor, más de su daño sale de él. */
export type DamageProfile = Record<Element, number>;

/** Elementos de las etiquetas de una gema. */
export const elementsOf = (tags: string[]): Element[] => ELEMENTS.filter(e => tags.includes(e));

// Líneas de nodos y objetos que dan daño de un elemento: "+10% to Cold Damage", "Adds 5 to 9 Fire Damage", "Physical Damage"…
const ELEMENT_RE: [Element, RegExp][] = ELEMENTS.map(e => [e, new RegExp(String.raw`\b${e}\b.*\b(damage|penetration)\b|\b(damage|penetration)\b.*\b${e}\b`, "i")]);

/**
 * Perfil de daño de la build. Suma: la habilidad principal (cada elemento de sus etiquetas, 2), los soportes de su grupo (cada elemento, 1)
 * y las líneas de daño elemental del árbol y del equipo (0,25 cada una). Un ataque o hechizo sin ningún elemento cuenta como físico.
 */
export function damageProfile(build: Build): DamageProfile {
  const p: DamageProfile = { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 };
  const main = build.main;
  if (main) {
    const tags = SKILLS[main.id]?.tags ?? [];
    for (const e of elementsOf(tags)) p[e] += 2;
    // Un ataque sin elementos es de daño físico.
    if (!elementsOf(tags).length && (SKILLS[main.id]?.types.includes("Attack") ?? false)) p.physical += 2;
    for (const s of main.supports) for (const e of elementsOf(SKILLS[s]?.tags ?? [])) p[e] += 1;
  }
  const lines = [...build.tree.nodes.flatMap(id => NODES[id]?.stats ?? []), ...build.items.flatMap(i => i.mods)];
  for (const l of lines) for (const [e, re] of ELEMENT_RE) if (re.test(l)) p[e] += 0.25;
  return p;
}

/** Los elementos con peso importante en el perfil (al menos el 20 % del total), de más a menos. */
export function mainElements(p: DamageProfile): Element[] {
  const total = ELEMENTS.reduce((n, e) => n + p[e], 0) || 1;
  return ELEMENTS.filter(e => p[e] / total >= 0.2).sort((a, b) => p[b] - p[a]);
}

/**
 * Cuánto encaja una gema con el daño de la build: de -0,5 (usa elementos que la build no usa) a 1 (usa solo los de la build).
 * Sin ningún elemento en sus etiquetas, 0: no ayuda ni estorba.
 */
export function elementFit(id: string, p: DamageProfile): number {
  const els = elementsOf(SKILLS[id]?.tags ?? []);
  if (!els.length) return 0;
  const total = ELEMENTS.reduce((n, e) => n + p[e], 0) || 1;
  return els.reduce((n, e) => n + (p[e] > 0 ? p[e] / total : -0.5), 0) / els.length;
}

/** Nombre de un elemento para el usuario. */
export const ELEMENT_ES: Record<Element, string> = { physical: "físico", fire: "fuego", cold: "frío", lightning: "rayo", chaos: "caos" };

/** De dónde sale la mayor parte del daño de la build: de los golpes o de un efecto que dura (veneno, ignite, sangrado). */
export type FormKind = "hit" | "poison" | "ignite" | "bleed";
/** Cómo llamar a cada forma de daño en la guía ("sale sobre todo de …"). */
export const FORM_ES: Record<FormKind, string> = { hit: "los golpes", poison: "el veneno", ignite: "el ignite", bleed: "el sangrado" };
/** La forma de daño dominante y qué parte del total es (de 0 a 1). */
export interface DamageForm { kind: FormKind; share: number }

/**
 * La forma de daño que Path of Building calculó para la build, a partir de sus estadísticas guardadas en el código: el DPS de los
 * golpes (TotalDPS) frente a lo que añaden el veneno, el ignite y el sangrado (WithPoisonDPS, WithIgniteDPS, WithBleedDPS menos el de
 * los golpes). Es null si el código no trae esos datos.
 */
export function damageForm(stats: Record<string, number>): DamageForm | null {
  const hit = stats.TotalDPS ?? 0, extra = (key: string) => Math.max(0, (stats[key] ?? 0) - hit);
  const parts: Record<FormKind, number> = { hit, poison: extra("WithPoisonDPS"), ignite: extra("WithIgniteDPS"), bleed: extra("WithBleedDPS") };
  const total = parts.hit + parts.poison + parts.ignite + parts.bleed;
  if (!total) return null;
  const kind = (Object.keys(parts) as FormKind[]).reduce((best, k) => (parts[k] > parts[best] ? k : best), "hit");
  return { kind, share: parts[kind] / total };
}

// Gemas que potencian cada efecto, por nombre: las etiquetas de RePoE no dicen si un soporte escala el veneno o el ignite.
const AILMENT_ALL = "Cruelty|Unbound Ailments|Deadly Ailments|Swift Affliction|Withering";
const FORM_RE: Record<FormKind, RegExp | null> = {
  hit: null,
  poison: new RegExp(`Poison|Void Manipulation|Chaos|Viper Strike|Pestilent Strike|Toxic Rain|Caustic Arrow|Blight|Essence Drain|${AILMENT_ALL}`),
  ignite: new RegExp(`Ignite|Immolate|Burning|Combustion|${AILMENT_ALL}`),
  bleed: new RegExp(`Bleed|Impale|Maim|${AILMENT_ALL}`),
};

/** 1 si la gema potencia la forma de daño de la build (soportes de veneno para una build de veneno…), 0 si no. */
export function formFit(id: string, form: DamageForm | null): number {
  const re = form && FORM_RE[form.kind];
  return re && re.test(GEMS[id]?.name ?? "") ? 1 : 0;
}

/** El daño de una build: sus elementos y su forma. */
export interface Damage { profile: DamageProfile; form: DamageForm | null }
export const damageOf = (build: Build): Damage => ({ profile: damageProfile(build), form: damageForm(build.stats) });
