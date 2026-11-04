/*
 * "Mi leveling" dentro del código de PoB, como Loadouts: un tramo es un árbol y un conjunto de habilidades con el mismo número
 * entre llaves al final del nombre ("Leveling 2 (nv 13-28) {2}"); PoB junta así los conjuntos de un Loadout. Las notas de cada
 * tramo van en un bloque al final de las notas de la build. Leer esos Loadouts es lo contrario: devuelve los tramos.
 */

import { GEMS } from "../data";
import { isActive, isSupport } from "../gems";

/** Un tramo listo para escribir: sus niveles, sus gemas, sus nodos de árbol y su nota. */
export interface LoadoutStage extends Omit<MyStage, "points"> { from: number; nodes: string[] }

const GEM_PATH = "Metadata/Items/Gems/";
export const NOTES_MARK = "== Mi leveling (poe-leveling-guide) ==";
const TITLE = /^Leveling (\d+) \(nv (\d+)-(\d+)\) \{(\d+)\}$/;

/** El título de los conjuntos de un tramo, con su número de Loadout. */
export const stageTitle = (k: number, from: number, to: number): string => `Leveling ${k} (nv ${from}-${to}) {${k}}`;
/** Si el título es el de un tramo de "Mi leveling" (y no un árbol o un conjunto del autor). */
export const isStageTitle = (title: string | null): boolean => TITLE.test(title ?? "");

const el = (doc: Document, name: string, attrs: Record<string, string> = {}): Element => {
  const e = doc.createElement(name);
  for (const [k, v] of Object.entries(attrs)) e.setAttributeNS(null, k, v);
  return e;
};

/** Añade los números de Loadout a un título, dentro de las llaves del final si ya las tiene ("Early {1}" + 2 → "Early {1,2}"). */
function withIds(title: string, ids: number[]): string {
  const m = /\{([\w,\s]*)\}\s*$/.exec(title);
  if (!m) return `${title}${title ? " " : ""}{${ids.join(",")}}`;
  const have = m[1].split(",").map(x => x.trim()).filter(Boolean);
  return title.slice(0, m.index) + `{${[...have, ...ids.map(String).filter(x => !have.includes(x))].join(",")}}`;
}

/** El <Gem> de una gema: copia el de la build si ya trae esa gema (con su skillId y demás) o lo escribe con lo que sabemos. */
function gemElement(doc: Document, id: string): Element {
  const known = [...doc.querySelectorAll("Gem")].find(g => g.getAttribute("gemId") === GEM_PATH + id);
  if (known) { const g = known.cloneNode(false) as Element; g.setAttribute("level", "1"); g.setAttribute("quality", "0"); return g; }
  const name = GEMS[id].name.replace(/ Support$/, "");
  return el(doc, "Gem", { level: "1", quality: "0", qualityId: "Default", enabled: "true", enableGlobal1: "true", enableGlobal2: "true", count: "1", gemId: GEM_PATH + id, nameSpec: name });
}

/** Un grupo de gemas (<Skill>) con las gemas dadas. */
function groupElement(doc: Document, ids: string[]): Element {
  const g = el(doc, "Skill", { enabled: "true", slot: "", label: "", mainActiveSkill: "1", includeInFullDPS: "false" });
  ids.forEach(id => g.append(gemElement(doc, id)));
  return g;
}

/**
 * El XML de la build con un Loadout por tramo: un <Spec> con sus nodos y un <SkillSet> con su habilidad, sus soportes y las otras
 * habilidades (un grupo cada una), y sus notas en un bloque al final de <Notes>. Si hay varios conjuntos de objetos o de ajustes,
 * el activo se enlaza a todos los tramos (un Loadout necesita los cuatro tipos). Lo que ya había no se toca.
 */
export function exportLoadouts(xml: string, stages: LoadoutStage[]): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const root = doc.querySelector("PathOfBuilding")!;
  const tree = doc.querySelector("Tree"), skills = doc.querySelector("Skills");
  if (!tree || !skills) throw new Error("el código no tiene árbol o habilidades");
  const spec = tree.querySelectorAll(":scope > Spec")[(Number(tree.getAttribute("activeSpec")) || 1) - 1] ?? tree.querySelector(":scope > Spec")!;
  const ids = stages.map((_, i) => i + 1);

  // Sin conjuntos de habilidades (formato antiguo) las <Skill> se meten en uno, para que los nuevos sean sus hermanos.
  if (!skills.querySelector(":scope > SkillSet")) {
    const first = el(doc, "SkillSet", { id: "1" });
    first.append(...skills.querySelectorAll(":scope > Skill"));
    skills.append(first);
    skills.setAttribute("activeSkillSet", "1");
  }
  const nextSkill = Math.max(0, ...[...skills.querySelectorAll(":scope > SkillSet")].map(s => Number(s.getAttribute("id")) || 0)) + 1;

  stages.forEach((s, i) => {
    const title = stageTitle(i + 1, s.from, s.to);
    // Los atributos del árbol activo (clase, versión del árbol…) se copian; los nodos son los del tramo, sin maestrías ni joyas.
    const t = spec.cloneNode(false) as Element;
    t.setAttribute("title", title); t.setAttribute("nodes", s.nodes.join(",")); t.setAttribute("masteryEffects", "");
    tree.append(t);
    const set = el(doc, "SkillSet", { id: String(nextSkill + i), title });
    if (s.skill) set.append(groupElement(doc, [s.skill, ...s.supports]));
    s.others.forEach(id => set.append(groupElement(doc, [id])));
    skills.append(set);
  });

  for (const [container, set] of [["Items", "ItemSet"], ["Config", "ConfigSet"]] as const) {
    const all = [...doc.querySelectorAll(`${container} > ${set}`)];
    if (all.length > 1) {
      const active = all.find(x => x.getAttribute("id") === doc.querySelector(container)?.getAttribute(`active${set}`)) ?? all[0];
      active.setAttribute("title", withIds(active.getAttribute("title") ?? "", ids));
    }
  }

  const notes = stages.map((s, i) => s.note.trim() && `${stageTitle(i + 1, s.from, s.to).replace(/ \{\d+\}$/, "")}: ${s.note.trim().replace(/\s+/g, " ")}`).filter(Boolean);
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
    const groups = [...(set?.querySelectorAll(":scope > Skill") ?? [])].map(g => [...g.querySelectorAll("Gem")].map(idOf).filter((id): id is string => !!id)).filter(g => g.length);
    const [main, ...rest] = groups, skill = main?.find(isActive) ?? null;
    return {
      to: Number(m![3]), skill, supports: main && skill ? main.filter(id => id !== skill && isSupport(id)) : [],
      others: rest.map(g => g.find(isActive)).filter((id): id is string => !!id),
      points: (s.getAttribute("nodes") || "").split(",").filter(Boolean).length, note: noteLines.get(`Leveling ${m![1]} (nv ${m![2]}-${m![3]})`) ?? "",
    };
  });
}
