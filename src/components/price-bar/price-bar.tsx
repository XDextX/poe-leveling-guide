/*
 * La barra de precios de la tabla de únicos: la liga (la última de temporada en softcore si no has elegido otra), el botón de
 * actualizar y cuándo se comprobaron los precios. Rellena la columna "Precio" de las filas y pone la liga en sus enlaces al comercio.
 * Los precios se piden al mostrarse y se reutilizan una hora (recargar la página no vuelve a descargarlos).
 */

import { ago, categoriesOf, currentLeague, formatPrice, priceFor } from "../../js/prices";
import type { PriceMatch, Prices } from "../../js/prices";
import { tradeFilters } from "../../js/trade";
import { tradeUrl } from "../../js/unique-links";
import { DEFAULT_LEAGUE, saveLeague, savedLeague } from "./league";
import { loadLeagues, loadPrices } from "./price-source";
import { loadTradeStats } from "./trade-stats";
import "./price-bar.css";

/** Qué se sabe del precio: su rango, las ventas, y de qué variante es (o que no se supo cuál y es la más barata). */
const priceTip = ({ price: p, how, label, options }: PriceMatch): string => [
  `Entre ${Math.round(p.min)} y ${Math.round(p.max)} c · unas ${p.daily} ventas al día`,
  p.low ? "pocos datos, poco fiable" : "",
  how === "variant" ? `variante «${label}»` : how === "cheapest" ? `no se supo qué variante lleva: la más barata de ${options}` : "",
].filter(Boolean).join(" · ");
// Cada cuánto se pone al día el "hace N min".
const AGE_REFRESH_MS = 30000;

interface PriceBarProps {
  /** Los únicos y su fila de la tabla (con la celda .price y el enlace a.trade). */
  rows: { item: Item; row: HTMLElement }[];
}

/** La barra de precios; trabaja sobre las filas que se le dan. */
export const PriceBar: Component<PriceBarProps, HTMLDivElement> = ({ rows }) => {
  // Una lista y no un campo con sugerencias: el navegador filtra las sugerencias por lo escrito y, con "Allflame" puesto, no enseñaría Standard.
  const leagueSelect = <select><option value="">Buscando la liga…</option></select> as HTMLSelectElement;
  const refresh = <button class="price-btn" title="Vuelve a pedir los precios a poe.watch" onClick={() => void showPrices(true)}>Actualizar</button> as HTMLButtonElement;
  const status = <span class="price-status" /> as HTMLSpanElement;
  const league = () => leagueSelect.value || DEFAULT_LEAGUE;
  const cell = (row: HTMLElement) => row.querySelector<HTMLElement>(".price")!;
  // Lo que dice el estado y cuándo se descargaron los precios (0: no hay precios que fechar).
  let message = "", checkedAt = 0, run = 0;

  const renderStatus = () => { status.textContent = checkedAt ? `${message} · comprobados ${ago(checkedAt, Date.now())}` : message; };
  const clearPrices = () => rows.forEach(({ row }) => { cell(row).textContent = "—"; cell(row).removeAttribute("title"); });

  /** Pone el precio de cada único (el primero que dé alguna categoría) y devuelve cuántos tienen. */
  function fillPrices(all: Prices[]): number {
    let found = 0;
    for (const { item, row } of rows) {
      const match = all.map(prices => priceFor(prices, item)).find(Boolean);
      if (!match) continue;
      found++; cell(row).textContent = formatPrice(match.price) + (match.how === "cheapest" ? " *" : ""); cell(row).title = priceTip(match);
    }
    return found;
  }

  /** Pide (o toma de la copia) las categorías que usa la build y rellena la columna; los que no están en poe.watch se quedan en "—". */
  async function showPrices(force: boolean): Promise<void> {
    const id = ++run, l = league();
    refresh.disabled = true; checkedAt = 0; message = "Cargando precios…"; renderStatus(); clearPrices();
    try {
      const all: Prices[] = []; let oldest = Date.now();
      for (const category of categoriesOf(rows.map(r => r.item.slot))) {
        const { prices, at } = await loadPrices(l, category, force);
        if (id !== run) return;   // se cambió de liga mientras tanto: esta respuesta ya no vale
        all.push(prices); oldest = Math.min(oldest, at);
      }
      message = `${fillPrices(all)} de ${rows.length} con precio · poe.watch, liga ${l}. Aproximado`; checkedAt = oldest;
    } catch {
      if (id !== run) return;
      message = "No se pudieron cargar los precios (poe.watch no responde o la liga no existe).";
    } finally { if (id === run) refresh.disabled = false; }
    renderStatus();
  }

  /** Pone en los enlaces del comercio la liga y, si se supo cuáles son, los mods que distinguen la variante de cada único. */
  function setLinks(): void {
    const l = league();
    for (const { row } of rows) { const a = row.querySelector<HTMLAnchorElement>("a.trade")!; a.href = tradeUrl(l, a.dataset.name!, a.dataset.base!, JSON.parse(a.dataset.stats ?? "[]")); }
  }

  /** Para los únicos con variante, busca en la tabla del comercio los mods que la distinguen y los pone en su enlace. */
  function filterByVariant(): void {
    const withVariant = rows.filter(r => r.item.distinct.length);
    if (!withVariant.length) return;
    void loadTradeStats().then(table => {
      for (const { item, row } of withVariant) {
        const ids = tradeFilters(item.distinct, table), a = row.querySelector<HTMLAnchorElement>("a.trade")!;
        a.dataset.stats = JSON.stringify(ids);
        if (ids.length) a.dataset.tip = `Buscarlo en el comercio oficial, en tu liga y con los mods de tu variante o versión (${ids.length})`;
      }
      setLinks();
    });
  }

  /** Pone la liga en los enlaces del comercio y pide los precios de esa liga. */
  function useLeague(): void { setLinks(); void showPrices(false); }

  leagueSelect.addEventListener("change", () => { saveLeague(league()); useLeague(); });
  // Al mostrarse: la liga guardada o, si no hay, la última de temporada en softcore, y sus precios.
  void loadLeagues().then(all => {
    const names = all.map(x => x.name), chosen = savedLeague() ?? currentLeague(all);
    // La liga elegida sale aunque poe.watch no la tenga (una privada, o si no responde): así no se pierde.
    if (!names.includes(chosen)) names.unshift(chosen);
    leagueSelect.replaceChildren(...names.map(n => <option value={n} selected={n === chosen}>{n}</option>));
    useLeague();
    filterByVariant();
  });
  const timer = setInterval(() => { if (leagueSelect.isConnected) renderStatus(); else clearInterval(timer); }, AGE_REFRESH_MS);

  return <div class="price-bar"><label class="league-pick">Liga {leagueSelect}</label>{refresh}{status}</div> as HTMLDivElement;
};
