/* Ficha de una gema al pasar el ratón: etiquetas, nivel y atributos que pide, maná, descripción y efectos a nivel 1. Una sola ficha para toda la página. */

import { GEMS, SKILLS } from "../../js/data";
import { placeTip } from "../float-tip/float-tip";
import { loadGemText } from "./gem-text";
import "./gem-tip.css";

// Etiquetas internas de RePoE que no se ven en la ficha del juego.
const HIDDEN_TAGS = new Set(["low_max_level", "exceptional"]);
const tagText = (tag: string): string => tag.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const seconds = (n: number): string => n.toLocaleString("es", { maximumFractionDigits: 2 }) + " s";

interface GemTipContentProps { id: string; text: GemTextRow | undefined }

/** El contenido de la ficha de una gema; sin texto (gema sin datos) queda solo con lo que ya sabe la guía. */
const GemTipContent: Component<GemTipContentProps, DocumentFragment> = ({ id, text }) => {
  const { name, attr, level } = GEMS[id];
  const [description = "", cast = 0, mana = 0, str = 0, dex = 0, int = 0, lines = []] = text ?? [];
  const tags = (SKILLS[id]?.tags ?? []).filter(t => !HIDDEN_TAGS.has(t)).map(tagText);
  const needs = [["Str", str], ["Dex", dex], ["Int", int]].filter(([, n]) => n).map(([a, n]) => `${a} ${n}`);
  return (
    <>
      <div class={"gem-tip-head " + attr}><b>{name}</b></div>
      {tags.length > 0 && <p class="gem-tip-tags">{tags.join(", ")}</p>}
      <p class="gem-tip-req">Requiere nivel {level}{needs.length ? " · " + needs.join(" · ") : ""}</p>
      {(mana > 0 || cast > 0) && <p class="gem-tip-req">{[mana > 0 ? `Maná ${mana}` : "", cast > 0 ? `Tiempo ${seconds(cast)}` : ""].filter(Boolean).join(" · ")}</p>}
      {description && <p class="gem-tip-desc">{description}</p>}
      {lines.map(l => <p class="gem-tip-line">{l}</p>)}
    </>
  ) as DocumentFragment;
};

let tip: HTMLDivElement | null = null, current = "";
const element = (): HTMLDivElement => (tip ??= document.body.appendChild(<div class="gem-tip" hidden /> as HTMLDivElement));

/** Coloca la ficha junto al cursor, sin salirse de la ventana. */
function place(e: MouseEvent): void {
  const t = element();
  if (!t.hidden) placeTip(t, e.clientX, e.clientY, innerWidth, innerHeight, 16);
}

/** Enseña la ficha de la gema al entrar el ratón; los textos se cargan la primera vez, y mientras tanto sale lo que ya se sabe. */
export function showGemTip(id: string, e: MouseEvent): void {
  const t = element();
  current = id;
  t.replaceChildren(<GemTipContent id={id} text={window.DATA_TEXT?.[id]} />);
  t.hidden = false;
  place(e);
  if (!window.DATA_TEXT) void loadGemText().then(all => {
    // Si el ratón ya está en otra gema (o fuera), no se pisa su ficha.
    if (current !== id || t.hidden) return;
    t.replaceChildren(<GemTipContent id={id} text={all[id]} />);
    place(e);
  });
}

/** Sigue al cursor mientras está sobre la gema. */
export const moveGemTip = place;

/** Quita la ficha al salir el ratón. */
export function hideGemTip(): void { current = ""; if (tip) tip.hidden = true; }
