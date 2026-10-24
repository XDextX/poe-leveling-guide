/* Gemas que no salen en la ruta y cómo conseguirlas. */

import { GEMS } from "../../js/data";
import { NamedList } from "../named-list/named-list";
import { Section } from "../section/section";
import "./other-ways.css";

interface OtherWaysProps {
  build: Build;
  plan: Plan;
}

/** Gemas que no salen en la ruta para esta clase y cómo conseguirlas, o null si no hay ninguna. */
export const OtherWays: Component<OtherWaysProps, HTMLDetailsElement | null> = ({ build, plan }) => {
  const { got, missing } = plan;
  const where = (id: string): string => { const at = got.get(id); return at ? ` (acto ${at.act}, ${at.quest})` : ""; };
  const notes = build.gems.filter(g => g.kind !== "normal").map((g): [string, string] => {
    if (g.kind === "vaal") return [g.name, g.base ? `Consigue ${GEMS[g.base].name}${where(g.base)} y corrómpela con un Orbe Vaal (puede salir otra cosa), o búscala en drop o en el mercado.` : "Búscala en drop o en el mercado."];
    if (g.kind === "transfigured") return [g.name, g.base ? `Es una gema transfigurada: consigue ${GEMS[g.base].name}${where(g.base)} y transfigúrala en la Fuente Divina del Laberinto, o búscala en drop o en el mercado.` : "Es una gema transfigurada: búscala en drop o en el mercado."];
    if (g.kind === "awakened") return [g.name, "Gema despertada: solo cae en el endgame. Lo práctico es comprarla en el mercado."];
    return [g.name, "No la reconozco en los datos; puede ser una gema nueva o un nombre que no coincide."];
  });
  for (const id of missing) notes.push([GEMS[id].name, "No sale en ninguna misión ni vendedor de la ruta para esta clase: drop o mercado."]);
  if (!notes.length) return null;
  return (
    <Section title="Por otras vías" className="act other" toc={{ id: "otras-vias", label: "Por otras vías" }}>
      <NamedList items={notes} />
    </Section>
  ) as HTMLDetailsElement;
};
