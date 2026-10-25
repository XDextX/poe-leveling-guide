/* Tipos compartidos por los scripts de la app. Todos los archivos de src/ son scripts globales (comparten un único
   <script> en index.html), así que estas declaraciones también son globales: sin import ni export. */

/* ---------- Datos en crudo, como los escribe scripts/gamedata.mts en public/gamedata/ (campos por posición para que ocupen poco) ---------- */

/** Gema: [nombre, atributo (s/d/i/-), nivel requerido] */
/** icon: ruta del arte de la gema sin "Art/" ni extensión; "" si RePoE no la conoce. */
type GemRow = [name: string, attr: string, level: number, icon: string];
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
/** Texto de la ficha de una gema a nivel 1: [descripción, segundos de lanzamiento, maná, fuerza, destreza, inteligencia que pide, líneas de efecto]. */
type GemTextRow = [description: string, castTime: number, mana: number, str: number, dex: number, int: number, lines: string[]];
interface Window { DATA?: Partial<GameDataRaw>; DATA_TEXT?: Record<string, GemTextRow>; DATA_TRADE?: Record<string, string> }

/* ---------- Datos con nombre, como los usa la app (src/js/data.ts) ---------- */

interface Gem { name: string; attr: string; level: number; icon: string }
interface Offer { npc: string; rewards: Record<string, ClassMask>; vendor: Record<string, [ClassMask, string]> }
interface Quest { name: string; offers: Record<string, Offer> }
interface Area { name: string; act: number; level: number; town: boolean; townId: string | null; recipes: string[] }
interface Skill { tags: string[]; types: string[]; weapons: string[]; allowed: string[]; excluded: string[] }
interface TreeNode { x: number; y: number; type: number; name: string; stats: string[]; ascendancy: string; reminder: string[]; icon: NodeIcon | 0 }

/* ---------- La build, leída del código de Path of Building (src/js/pob.ts) ---------- */

type GemKind = "normal" | "vaal" | "transfigured" | "awakened" | "unknown";
interface BuildGem { name: string; id: string | null; kind: GemKind; base?: string }
interface Item {
  slot: string; rarity: string; name: string; base: string; req: number; mods: string[]; implicits: number;
  /** Las etiquetas de las variantes que el autor eligió en un único con varias versiones ("Frenzy Current"); vacío si no tiene. */
  variants: string[];
  /** Los mods propios de esa variante (los que no valen para todas), para distinguirla en el comercio. */
  distinct: string[];
}
interface TreeStage { title: string; nodes: string[]; level?: number; points?: number }
interface BuildTree { nodes: string[]; masteries: [node: string, effect: string][]; classId: string | null; stages: TreeStage[] }
interface MainSkill { id: string; supports: string[] }
interface Build {
  cls: string | null; ascend: string | null; bandit: string;
  gems: BuildGem[]; items: Item[]; tree: BuildTree; main: MainSkill | null;
  /** Los grupos de gemas del conjunto activo (ids de las que conocemos, en su orden), uno por habilidad de la build. */
  groups: string[][];
  /** Las notas que el autor dejó en el código (instrucciones, alternativas, a veces una guía de leveling), en texto plano; "" si no hay. */
  notes: string;
  /** Las estadísticas que Path of Building calculó y guardó en el código (TotalDPS, PoisonDPS, Life…); vacío si el código no las trae. */
  stats: Record<string, number>;
}

/* ---------- Ruta, plan y sugerencias ---------- */

interface RouteStep { act: number; line: string; notes: string[] }
interface GemGroup { how: string; npc?: string; ids: string[]; buy?: boolean }
/** zone: el paso lleva a otra zona (entrar, waypoint, logout o portal de vuelta), así que abre un bloque de la ruta. */
interface PlannedStep { act: number; text: string; notes: string[]; gems: GemGroup[]; zone: boolean }
interface GotAt { act: number; quest: string }
interface Plan { out: PlannedStep[]; got: Map<string, GotAt>; start: string[]; missing: string[] }
interface StageSkill {
  acts: [number, number]; from: number; to: number; skill: string | null; own: boolean; supports: string[]; mainAt: number | null;
  /** Enlaces como máximo en una armadura de pecho de este tramo: skill + soportes caben en esas casillas (nivel de objeto del final del tramo). */
  links: number;
  /** Habilidades entre las que se puede elegir en este tramo (la elegida y las mejores alternativas, con su puntuación); vacío si la habilidad es la de la build. */
  options: { id: string; score: number }[];
  /** La que recomienda la app en este tramo, aunque se haya elegido otra; null si no hay sustituta. */
  recommended: string | null;
  /** La habilidad que había aquí y se quitó porque no cabe en los límites de maldiciones o marcas (solo sale en la nota del tramo). */
  dropped?: string;
  /** La habilidad que había aquí y se quitó porque no cabe en las casillas del equipo de este tramo (solo sale en la nota del tramo). */
  noRoom?: string;
}
/** Lo que devuelve un componente: un elemento o un fragmento listo para meter en la página. */
type View = HTMLElement | DocumentFragment;
/**
 * Un componente de src/components/: una función que recibe sus props (un objeto, con su interfaz <Nombre>Props junto al
 * componente) y devuelve DOM. R afina el tipo, o admite null si puede no haber nada que mostrar.
 * Las demás funciones de esa carpeta son ayudantes, no componentes.
 */
// interface y no type: así el editor muestra "Component<…>" al pasar el ratón, en vez de expandirlo a la firma.
interface Component<P extends object, R extends View | null = View> { (props: P): R }

/** Fecha de descarga de los datos y licencia de exile-leveling: las define Vite al compilar (define en vite.config.ts). */
declare const PAGE_DATE: string;
declare const PAGE_LICENSE: string;

/* ---------- JSX (src/js/dom.ts: h y Fragment) ---------- */

declare namespace JSX {
  /** Lo que da una expresión JSX: un nodo DOM real. Se afina con "as" cuando hace falta (as HTMLCanvasElement). */
  type Element = Node;
  /** Lo que puede ir dentro de una etiqueta: nodos, textos, números o nada (null, undefined, booleanos). */
  type Child = Node | string | number | boolean | null | undefined | Child[];
  /** Los hijos llegan a los componentes en props.children. */
  interface ElementChildrenAttribute { children: {} }
  /** Atributos de las etiquetas HTML (ver h() en src/js/dom.ts). */
  interface HtmlProps {
    class?: string;
    style?: string;
    /** HTML sin escapar: solo para HTML generado por la app, nunca para datos del usuario. */
    html?: string;
    children?: Child | Child[];
    [attr: string]: unknown;
  }
  interface IntrinsicElements { [tag: string]: HtmlProps }
}
interface GuideOptions { cls: string; leagueStart: boolean; showZones: boolean }
type StatKind = "dmg" | "def" | "other";
/** Una entrada del índice: destino de una sección marcada con data-toc. */
/** group agrupa entradas como chips; parent (el id de otro destino) la anida bajo él. */
interface TocTarget { id: string; label: string; group?: string; parent?: string }
