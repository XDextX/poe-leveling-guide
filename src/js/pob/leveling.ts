/*
 * "Mi leveling" dentro del código de PoB, como Loadouts: un tramo es un árbol y un conjunto de habilidades con el mismo número
 * entre llaves en el nombre ("Leveling 2 (nv 13-28) {5}"); PoB junta así los conjuntos de un Loadout. Las notas de cada tramo
 * van en un bloque al final de las notas de la build. Leer esos Loadouts es lo contrario: devuelve los tramos.
 */

import { GEMS } from "../data";
import { isActive, isSupport } from "../gems";

/** Un tramo listo para escribir: sus niveles, sus gemas, sus nodos de árbol y su nota. */
export interface LoadoutStage extends Omit<MyStage, "points"> { from: number; nodes: string[] }

const GEM_PATH = "Metadata/Items/Gems/";
export const NOTES_MARK = "== Mi leveling (poe-leveling-guide) ==";
// "Leveling <tramo> (nv <desde>-<hasta>) {<número de Loadout>}": el número de Loadout no es el del tramo, porque el autor puede tener los suyos.
const TITLE = /^Leveling (\d+) \(nv (\d+)-(\d+)\) \{(\d+)\}$/;
// La etiqueta del grupo de la habilidad principal: así se distingue de las otras aunque no tenga gemas.
const MAIN_LABEL = "Principal";
// PoB toma como identificadores de Loadout lo que va en el primer {…} del nombre, esté donde esté.
const IDS = /\{([^}]*)\}/;

/** El título de los conjuntos de un tramo: su posición, sus niveles y su número de Loadout. */
export const stageTitle = (k: number, from: number, to: number, loadout: number): string => `Leveling ${k} (nv ${from}-${to}) {${loadout}}`;
/** Si el título es el de un tramo de "Mi leveling" (y no un árbol o un conjunto del autor). */
export const isStageTitle = (title: string | null): boolean => TITLE.test(title ?? "");

const el = (doc: Document, name: string, attrs: Record<string, string> = {}): Element => {
  const e = doc.createElement(name);
  for (const [k, v] of Object.entries(attrs)) e.setAttributeNS(null, k, v);
  return e;
};

/** Los identificadores de Loadout de un nombre ("Early {1, b}" → ["1", "b"]). */
const idsOf = (title: string): string[] => (IDS.exec(title)?.[1] ?? "").split(",").map(x => x.trim()).filter(Boolean);

/** El nombre con otros identificadores en su {…} (o con uno nuevo al final si no lo tiene). */
function withIds(title: string, ids: string[]): string {
  if (!ids.length) return title.replace(IDS, "").replace(/\s{2,}/g, " ").trim();
  return IDS.test(title) ? title.replace(IDS, `{${ids.join(",")}}`) : `${title}${title ? " " : ""}{${ids.join(",")}}`;
}

/** El <Gem> de una gema: copia el de la build si ya trae esa gema (con su skillId y demás) o lo escribe con lo que sabemos. */
function gemElement(doc: Document, id: string): Element {
  const known = [...doc.querySelectorAll("Gem")].find(g => g.getAttribute("gemId") === GEM_PATH + id);
  if (known) { const g = known.cloneNode(false) as Element; g.setAttribute("level", "1"); g.setAttribute("quality", "0"); return g; }
  const name = GEMS[id].name.replace(/ Support$/, "");
  return el(doc, "Gem", { level: "1", quality: "0", qualityId: "Default", enabled: "true", enableGlobal1: "true", enableGlobal2: "true", count: "1", gemId: GEM_PATH + id, nameSpec: name });
}

/** Un grupo de gemas (<Skill>) con las gemas dadas. */
function groupElement(doc: Document, ids: string[], label = ""): Element {
  const g = el(doc, "Skill", { enabled: "true", slot: "", label, mainActiveSkill: "1", includeInFullDPS: "false" });
  ids.forEach(id => g.append(gemElement(doc, id)));
  return g;
}

/**
 * El XML de la build con un Loadout por tramo: un <Spec> con sus nodos y un <SkillSet> con su habilidad principal (el primer
 * grupo, aunque esté vacío), sus soportes y las otras habilidades (un grupo cada una), y sus notas en un bloque al final de
 * <Notes>. Si ya había tramos de "Mi leveling" se sustituyen (no se duplican). Los números de Loadout van por encima de los que ya
 * usan los conjuntos del autor. Si hay varios conjuntos de objetos o de ajustes, el activo se enlaza a todos los tramos (un
 * Loadout necesita los cuatro tipos). Lo demás no se toca.
 */
export function exportLoadouts(xml: string, stages: LoadoutStage[]): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const root = doc.querySelector("PathOfBuilding")!;
  const tree = doc.querySelector("Tree"), skills = doc.querySelector("Skills");
  if (!tree || !skills) throw new Error("el código no tiene árbol o habilidades");

  // Sin conjuntos de habilidades (formato antiguo) las <Skill> se meten en uno, para que los nuevos sean sus hermanos.
  if (!skills.querySelector(":scope > SkillSet")) {
    const first = el(doc, "SkillSet", { id: "1" });
    first.append(...skills.querySelectorAll(":scope > Skill"));
    skills.append(first);
    skills.setAttribute("activeSkillSet", "1");
  }

  // Fuera los tramos de una exportación anterior y sus números de Loadout de los conjuntos de objetos y de ajustes.
  const specs = [...tree.querySelectorAll(":scope > Spec")], activeSpec = specs[(Number(tree.getAttribute("activeSpec")) || 1) - 1];
  const activeSet = skills.querySelector(`:scope > SkillSet[id="${skills.getAttribute("activeSkillSet")}"]`);
  const old = [...specs, ...skills.querySelectorAll(":scope > SkillSet")].filter(e => isStageTitle(e.getAttribute("title")));
  const oldIds = new Set(old.flatMap(e => idsOf(e.getAttribute("title") ?? "")));
  old.forEach(e => e.remove());
  for (const set of doc.querySelectorAll("Items > ItemSet, Config > ConfigSet")) {
    const title = set.getAttribute("title") ?? "";
    if (idsOf(title).some(id => oldIds.has(id))) set.setAttribute("title", withIds(title, idsOf(title).filter(id => !oldIds.has(id))));
  }
  const left = [...tree.querySelectorAll(":scope > Spec")];
  if (!left.length) throw new Error("el código no tiene ningún árbol");
  // Los activos siguen siendo los mismos; si era uno de los quitados, el primero que queda.
  const base = left.includes(activeSpec) ? activeSpec : left[0];
  tree.setAttribute("activeSpec", String(left.indexOf(base) + 1));
  const sets = [...skills.querySelectorAll(":scope > SkillSet")];
  if (activeSet && !sets.includes(activeSet)) skills.setAttribute("activeSkillSet", sets[0]?.getAttribute("id") ?? "1");

  const used = [...doc.querySelectorAll("Tree > Spec, Skills > SkillSet, Items > ItemSet, Config > ConfigSet")].flatMap(e => idsOf(e.getAttribute("title") ?? "")).map(Number).filter(Number.isInteger);
  const first = Math.max(0, ...used) + 1, nextSkill = Math.max(0, ...sets.map(s => Number(s.getAttribute("id")) || 0)) + 1;
  const loadouts = stages.map((_, i) => first + i);

  stages.forEach((s, i) => {
    const title = stageTitle(i + 1, s.from, s.to, loadouts[i]);
    // Los atributos del árbol activo (clase, versión del árbol…) se copian; los nodos son los del tramo, sin maestrías ni joyas.
    const t = base.cloneNode(false) as Element;
    t.setAttribute("title", title); t.setAttribute("nodes", s.nodes.join(",")); t.setAttribute("masteryEffects", "");
    tree.append(t);
    const set = el(doc, "SkillSet", { id: String(nextSkill + i), title });
    set.append(groupElement(doc, s.skill ? [s.skill, ...s.supports] : [], MAIN_LABEL));
    s.others.forEach(o => set.append(groupElement(doc, [o.skill, ...o.supports])));
    skills.append(set);
  });

  for (const [container, set] of [["Items", "ItemSet"], ["Config", "ConfigSet"]] as const) {
    const all = [...doc.querySelectorAll(`${container} > ${set}`)];
    if (all.length > 1) {
      const active = all.find(x => x.getAttribute("id") === doc.querySelector(container)?.getAttribute(`active${set}`)) ?? all[0];
      active.setAttribute("title", withIds(active.getAttribute("title") ?? "", [...idsOf(active.getAttribute("title") ?? ""), ...loadouts.map(String)]));
    }
  }

  const notes = stages.map((s, i) => s.note.trim() && `${stageTitle(i + 1, s.from, s.to, 0).replace(/ \{\d+\}$/, "")}: ${s.note.trim().replace(/\s+/g, " ")}`).filter(Boolean);
  let notesEl = root.querySelector(":scope > Notes");
  if (!notesEl) { notesEl = el(doc, "Notes"); root.append(notesEl); }
  const before = (notesEl.textContent ?? "").split(NOTES_MARK)[0].trimEnd();
  notesEl.textContent = notes.length ? `${before ? before + "\n\n" : ""}${NOTES_MARK}\n${notes.join("\n")}` : before;
  return new XMLSerializer().serializeToString(doc);
}

/** Los tramos de "Mi leveling" que trae el código (sus Loadouts), por orden; undefined si no trae ninguno. */
export function parseLoadouts(doc: Document, idOf: (gem: Element) => string | null): MyStage[] | undefined {
  const found = [...doc.querySelectorAll("Tree > Spec")].map(s => ({ s, m: TITLE.exec(s.getAttribute("title") ?? "") })).filter(x => x.m);
  if (!found.length) return undefined;
  const noteLines = new Map<string, string>();
  for (const line of (doc.querySelector("PathOfBuilding > Notes")?.textContent ?? "").split(NOTES_MARK).slice(1).join("\n").split("\n")) {
    const m = /^(Leveling \d+ \(nv \d+-\d+\)): (.*)$/.exec(line.trim());
    if (m) noteLines.set(m[1], m[2]);
  }
  return found.sort((a, b) => Number(a.m![1]) - Number(b.m![1])).map(({ s, m }): MyStage => {
    const set = [...doc.querySelectorAll("Skills > SkillSet")].find(x => x.getAttribute("title") === s.getAttribute("title"));
    const all = [...(set?.querySelectorAll(":scope > Skill") ?? [])];
    // El grupo principal es el de la etiqueta; sin ella (otro programa lo escribió) se toma el primero.
    const main = all.find(g => g.getAttribute("label") === MAIN_LABEL) ?? all[0];
    const ids = (g: Element | undefined) => [...(g?.querySelectorAll("Gem") ?? [])].map(idOf).filter((id): id is string => !!id);
    const mainIds = ids(main), skill = mainIds.find(isActive) ?? null;
    return {
      to: Number(m![3]), skill, supports: skill ? mainIds.filter(id => id !== skill && isSupport(id)) : [],
      others: all.filter(g => g !== main).flatMap((g): MyOther[] => { const gem = ids(g), other = gem.find(isActive); return other ? [{ skill: other, supports: gem.filter(id => id !== other && isSupport(id)) }] : []; }),
      points: (s.getAttribute("nodes") || "").split(",").filter(Boolean).length, note: noteLines.get(`Leveling ${m![1]} (nv ${m![2]}-${m![3]})`) ?? "",
    };
  });
}
