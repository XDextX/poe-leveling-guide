/* Tabla de los únicos de la build, por nivel requerido, con su icono, su ficha y enlaces a la wiki y al comercio. */

import { tradeUrl } from "../../js/unique-links";
import { UniqueRow } from "../unique-row/unique-row";
import "./unique-table.css";

const LEAGUE_KEY = "poe-gemas:liga", DEFAULT_LEAGUE = "Standard";
const savedLeague = (): string => { try { return localStorage.getItem(LEAGUE_KEY)?.trim() || DEFAULT_LEAGUE; } catch { return DEFAULT_LEAGUE; } };

interface UniqueTableProps { uniques: Item[] }

/**
 * Tabla de únicos: una <UniqueRow> por objeto. Encima, la liga en que se busca en el comercio (la que escribas se recuerda en este
 * navegador); al cambiarla se actualizan todos los enlaces "Comercio".
 */
export const UniqueTable: Component<UniqueTableProps, DocumentFragment> = ({ uniques }) => {
  const table = (
    <table class="uniques">
      <thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th><th>Buscar</th></tr></thead>
      <tbody>{uniques.map(item => <UniqueRow item={item} league={savedLeague()} />)}</tbody>
    </table>
  ) as HTMLTableElement;
  const setLeague = (e: Event) => {
    const league = (e.target as HTMLInputElement).value.trim() || DEFAULT_LEAGUE;
    try { localStorage.setItem(LEAGUE_KEY, league); } catch {}
    table.querySelectorAll<HTMLAnchorElement>("a.trade").forEach(a => { a.href = tradeUrl(league, a.dataset.name!, a.dataset.base!); });
  };
  return (
    <>
      <label class="league-pick">Liga del comercio <input type="text" value={savedLeague()} placeholder={DEFAULT_LEAGUE} onChange={setLeague} /></label>
      {table}
    </>
  ) as DocumentFragment;
};
