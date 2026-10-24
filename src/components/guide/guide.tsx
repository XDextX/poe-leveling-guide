/* La guía entera de una build: resumen, leveling sugerido, equipo, árbol, ruta y gemas por otras vías. */

import { GearSection } from "../gear/gear";
import { LevelingSection } from "../leveling/leveling";
import { OtherWays } from "../other-ways/other-ways";
import { RouteSections } from "../route/route";
import { Summary } from "../summary/summary";
import { TreeSection } from "../tree/tree";
import type { GuideData } from "../../js/guide";

interface GuideProps {
  data: GuideData;
  /** Mostrar también los pasos de la ruta sin gemas ("Actividades de zona"). */
  showZones: boolean;
}

/** Las secciones de la guía; cada una sale solo si la build tiene con qué rellenarla. */
export const Guide: Component<GuideProps, DocumentFragment> = ({ data: { build, plan, who, skills, treeStages, treesSuggested, levelingTrees }, showZones }) => (
  <>
    <Summary build={build} plan={plan} who={who} />
    {skills.length > 0 && build.main && <LevelingSection skills={skills} trees={levelingTrees} treesSuggested={treesSuggested} mainId={build.main.id} />}
    {build.items.length > 0 && <GearSection items={build.items} />}
    {build.tree.nodes.length > 0 && <TreeSection tree={build.tree} stages={treeStages} stagesSuggested={treesSuggested} />}
    <RouteSections steps={plan.out} start={plan.start} showZones={showZones} />
    <OtherWays build={build} plan={plan} />
  </>
) as DocumentFragment;
