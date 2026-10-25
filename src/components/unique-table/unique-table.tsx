/* Tabla de los únicos de la build, por nivel requerido, con su icono, su ficha, su precio aproximado y enlaces a la wiki y al comercio. */

import { DEFAULT_LEAGUE, savedLeague } from "../price-bar/league";
import { PriceBar } from "../price-bar/price-bar";
import { UniqueRow } from "../unique-row/unique-row";
import "./unique-table.css";

interface UniqueTableProps { uniques: Item[] }

/** Tabla de únicos: una <UniqueRow> por objeto, con la barra de precios y liga encima. */
export const UniqueTable: Component<UniqueTableProps, DocumentFragment> = ({ uniques }) => {
  const league = savedLeague() ?? DEFAULT_LEAGUE;
  const rows = uniques.map(item => ({ item, row: <UniqueRow item={item} league={league} /> as HTMLTableRowElement }));
  return (
    <>
      <PriceBar rows={rows} />
      <table class="uniques">
        <thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th><th class="n">Precio</th><th>Buscar</th></tr></thead>
        <tbody>{rows.map(r => r.row)}</tbody>
      </table>
    </>
  ) as DocumentFragment;
};
