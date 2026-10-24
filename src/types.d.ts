/* Tipos compartidos por los scripts de la app. Todos los archivos de src/ son scripts globales (comparten un único
   <script> en index.html), así que estas declaraciones también son globales: sin import ni export. */

/* ---------- Datos en crudo, como los escribe scripts/build.mts en gamedata/ (campos por posición para que ocupen poco) ---------- */

/** Gema: [nombre, atributo (s/d/i/-), nivel requerido] */
type GemRow = [name: string, attr: string, level: number];
/** RePoE: [etiquetas, tipos, armas, soporte: tipos admitidos, soporte: excluidos] (estos dos en notación polaca inversa) */
type SkillRow = [tags: string[], types: string[], weapons: string[], allowed: string[], excluded: string[]];
/** Máscara de bits por clase, en el orden de CLASSES. */
type ClassMask = number;
/** Oferta de misión: [npc, {gema: clases}, {gema: [clases, vendedor]}] */
type OfferRow = [npc: string, rewards: Record<string, ClassMask>, vendor: Record<string, [ClassMask, string]>];
interface QuestRaw { n: string; o: Record<string, OfferRow> }
/** Zona: [nombre, acto, nivel, ciudad (1/0), ciudad del acto, recetas de crafteo] */
type AreaRow = [name: string, act: number, level: number, town: 0 | 1, townId: string | null, recipes: string[]];
/** Nodo del árbol: [x, y, tipo, nombre, stats separadas por \n, ascendencia, aclaraciones separadas por \n, icono] */
type NodeRow = [x: number, y: number, type: number, name: string, stats: string, ascendancy: string, reminder: string, icon: NodeIcon | 0];
/** Icono en una hoja de sprites: [hoja (índice en sheets), x, y, ancho, alto] */
type NodeIcon = [sheet: number, x: number, y: number, w: number, h: number];
interface TreeRaw {
  nodes: Record<string, NodeRow>;
  /** Pares [a, b] en un array plano. */
  edges: number[];
  /** Maestría → efecto → stats separadas por \n */
  masteries: Record<string, Record<string, string>>;
  /** classId de Path of Building → nodo inicial */
  starts: Record<string, string>;
  /** Hojas de sprites de los iconos (CDN de GGG): [url, ancho, alto] */
  sheets: [url: string, w: number, h: number][];
}
interface GameDataRaw {
  CLASSES: string[];
  G: Record<string, GemRow>;
  K: Record<string, SkillRow>;
  Q: Record<string, QuestRaw>;
  A: Record<string, AreaRow>;
  START: Record<string, [start: string, chest: string]>;
  ROUTE: string;
  T: TreeRaw;
  U: Record<string, UniqueRow>;
}
/** Único: [ruta del icono bajo web.poecdn.com/image/Art/, ancho y alto en casillas] */
type UniqueRow = [path: string, w: number, h: number];
interface Window { DATA?: Partial<GameDataRaw> }

/* ---------- Datos con nombre, como los usa la app (src/js/data.ts) ---------- */

interface Gem { name: string; attr: string; level: number }
interface Offer { npc: string; rewards: Record<string, ClassMask>; vendor: Record<string, [ClassMask, string]> }
interface Quest { name: string; offers: Record<string, Offer> }
interface Area { name: string; act: number; level: number; town: boolean; townId: string | null; recipes: string[] }
interface Skill { tags: string[]; types: string[]; weapons: string[]; allowed: string[]; excluded: string[] }
interface TreeNode { x: number; y: number; type: number; name: string; stats: string[]; ascendancy: string; reminder: string[]; icon: NodeIcon | 0 }

/* ---------- La build, leída del código de Path of Building (src/js/pob.ts) ---------- */

type GemKind = "normal" | "vaal" | "transfigured" | "awakened" | "unknown";
interface BuildGem { name: string; id: string | null; kind: GemKind; base?: string }
interface Item { slot: string; rarity: string; name: string; base: string; req: number; mods: string[]; implicits: number }
interface TreeStage { title: string; nodes: string[]; level?: number; points?: number }
interface BuildTree { nodes: string[]; masteries: [node: string, effect: string][]; classId: string | null; stages: TreeStage[] }
interface MainSkill { id: string; supports: string[] }
interface Build {
  cls: string | null; ascend: string | null; bandit: string;
  gems: BuildGem[]; items: Item[]; tree: BuildTree; main: MainSkill | null;
}

/* ---------- Ruta, plan y sugerencias ---------- */

interface RouteStep { act: number; line: string; notes: string[] }
interface GemGroup { how: string; npc?: string; ids: string[]; buy?: boolean }
interface PlannedStep { act: number; text: string; notes: string[]; gems: GemGroup[] }
interface GotAt { act: number; quest: string }
interface Plan { out: PlannedStep[]; got: Map<string, GotAt>; start: string[]; missing: string[] }
interface StageSkill { acts: [number, number]; from: number; to: number; skill: string | null; own: boolean; supports: string[]; mainAt: number | null }
/** Lo que devuelve un componente: un elemento o un fragmento listo para meter en la página. */
type View = HTMLElement | DocumentFragment;
/**
 * Un componente de src/components/: una función que recibe datos y devuelve DOM (R afina el tipo, o admite null si
 * puede no haber nada que mostrar). Las demás funciones de esa carpeta son ayudantes, no componentes.
 */
type Component<A extends unknown[] = [], R extends View | null = View> = (...args: A) => R;
interface GuideOptions { cls: string; leagueStart: boolean; showZones: boolean }
type StatKind = "dmg" | "def" | "other";
/** Una entrada del índice: destino de una sección marcada con data-toc. */
interface TocTarget { id: string; label: string; group?: string }
