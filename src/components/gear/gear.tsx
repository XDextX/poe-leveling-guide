/* Equipo de la build: tabla de únicos y prioridad de stats de los raros. */

import { RareStats } from "../rare-stats/rare-stats";
import { Section, Subhead } from "../section/section";
import { UniqueTable } from "../unique-table/unique-table";

interface GearSectionProps { items: Item[] }

/** Equipo de la build: los únicos por nivel requerido y qué stats se repiten en sus raros. */
export const GearSection: Component<GearSectionProps, HTMLDetailsElement> = ({ items }) => {
  // Por nivel requerido; los que no piden nivel (joyas) van al final.
  const uniques = items.filter(i => i.rarity === "UNIQUE").sort((a, b) => (a.req || 999) - (b.req || 999));
  // Las joyas del árbol no son equipo: contarían como "raros" con stats de pasivas.
  const rares = items.filter(i => i.rarity === "RARE" && i.slot !== "Jewel" && !i.slot.includes("Abyssal"));
  return (
    <Section title="Equipo de la build" className="act gear" toc={{ id: "equipo", label: "Equipo" }}>
      {uniques.length > 0 && <><Subhead>Únicos</Subhead><UniqueTable uniques={uniques} /></>}
      {rares.length > 0 && <><Subhead>Prioridad de stats en los raros</Subhead><RareStats rares={rares} /></>}
      <p class="note">En la campaña, las resistencias bajan un 30 % al matar a Kitava en el acto 5 y otro 30 % en el acto 10: conviene ir subiéndolas antes de cada uno.</p>
    </Section>
  ) as HTMLDetailsElement;
};
