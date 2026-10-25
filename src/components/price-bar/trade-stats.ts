/* La tabla de mods del comercio (gamedata/tradestats.js): pesa bastante, así que se carga la primera vez que hace falta. */

let loading: Promise<Record<string, string>> | null = null;

/** Carga gamedata/tradestats.js una sola vez (con <script src>, que funciona también abriendo el archivo con doble clic). Si falla, devuelve una tabla vacía. */
export function loadTradeStats(): Promise<Record<string, string>> {
  if (window.DATA_TRADE) return Promise.resolve(window.DATA_TRADE);
  loading ??= new Promise(resolve => {
    const script = document.createElement("script");
    script.src = "gamedata/tradestats.js";
    script.onload = () => resolve(window.DATA_TRADE ?? {});
    script.onerror = () => { loading = null; resolve({}); };
    document.head.append(script);
  });
  return loading;
}
