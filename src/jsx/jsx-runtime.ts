/*
 * Runtime del JSX de la app (lo que llama el JSX compilado: <div class="x" /> es jsx("div", { class: "x" })). Sin React
 * ni Virtual DOM. En el navegador crea nodos DOM reales; en Node (el prerender del build, sin `document`) escribe HTML.
 * Las dos ramas siguen las mismas reglas:
 * - on<Evento> engancha un oyente (en HTML no se escribe);
 * - html pone HTML sin escapar, solo para HTML que genera la propia app;
 * - los textos van como atributo (spellcheck="false" es "false"), true es un atributo sin valor y false/null no se ponen;
 * - el resto va como propiedad si el elemento la tiene (checked, open, hidden, tabIndex…) o como atributo;
 * - los hijos de texto siempre van como texto, nunca como HTML.
 */

type Props = Record<string, unknown> & { children?: JSX.Child };
type Tag = string | ((props: any) => JSX.Element | null);

/** HTML ya escrito (rama de Node): lo que devuelven los elementos, para no escaparlo dos veces. */
export class Html {
  readonly html: string;
  constructor(html: string) { this.html = html; }
}

const SERVER = typeof document === "undefined";
const VOID = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
// Propiedades del DOM cuyo atributo HTML se llama distinto.
const ATTR: Record<string, string> = { tabIndex: "tabindex", className: "class", htmlFor: "for" };
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escHtml = (s: string, quotes = false) => s.replace(quotes ? /[&<>"]/g : /[&<>]/g, c => ESC[c]);

/** Hijos como HTML (rama de Node). */
const toHtml = (c: unknown): string =>
  Array.isArray(c) ? c.map(toHtml).join("") : c instanceof Html ? c.html : c === null || c === undefined || typeof c === "boolean" ? "" : escHtml(String(c));

/** Añade hijos a un nodo (rama del navegador). */
function append(parent: Node, c: unknown): void {
  if (Array.isArray(c)) for (const x of c) append(parent, x);
  else if (c instanceof Node) parent.appendChild(c);
  else if (c !== null && c !== undefined && typeof c !== "boolean") parent.appendChild(document.createTextNode(String(c)));
}

function element(tag: string, props: Props): JSX.Element {
  const { children, ...attrs } = props;
  if (SERVER) {
    let html = "", inner: string | null = null;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false || typeof v === "function") continue;
      if (k === "html") { inner = String(v); continue; }
      html += v === true ? ` ${ATTR[k] ?? k}` : ` ${ATTR[k] ?? k}="${escHtml(String(v), true)}"`;
    }
    return new Html(VOID.has(tag) ? `<${tag}${html}>` : `<${tag}${html}>${inner ?? toHtml(children)}</${tag}>`) as unknown as JSX.Element;
  }
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "html") e.innerHTML = String(v);
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (typeof v !== "string" && k in e) (e as unknown as Record<string, unknown>)[k] = v;
    else e.setAttribute(k, v === true ? "" : String(v));
  }
  append(e, children);
  return e;
}

/** <>…</>: varios nodos sin envoltorio. */
export function Fragment({ children }: { children?: JSX.Child }): JSX.Element {
  if (SERVER) return new Html(toHtml(children)) as unknown as JSX.Element;
  const frag = document.createDocumentFragment();
  append(frag, children);
  return frag;
}

/** Lo que llama el JSX compilado. Los componentes reciben sus props con `children` dentro, como en React. */
export function jsx(tag: Tag, props: Props): JSX.Element | null {
  return typeof tag === "function" ? tag(props) : element(tag, props);
}
export { jsx as jsxs, jsx as jsxDEV };
