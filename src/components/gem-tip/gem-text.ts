/* Los textos de las fichas de gema (gamedata/gemtext.js): pesan bastante, así que se cargan la primera vez que hacen falta. */

let loading: Promise<Record<string, GemTextRow>> | null = null;

/** Carga gamedata/gemtext.js una sola vez (con <script src>, que funciona también abriendo el archivo con doble clic). Si falla, devuelve un objeto vacío. */
export function loadGemText(): Promise<Record<string, GemTextRow>> {
  if (window.DATA_TEXT) return Promise.resolve(window.DATA_TEXT);
  loading ??= new Promise(resolve => {
    const script = document.createElement("script");
    script.src = "gamedata/gemtext.js";
    script.onload = () => resolve(window.DATA_TEXT ?? {});
    script.onerror = () => { loading = null; resolve({}); };
    document.head.append(script);
  });
  return loading;
}
