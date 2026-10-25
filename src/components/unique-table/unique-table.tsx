/* Tabla de los únicos de la build, por nivel requerido, con su icono y su ficha. */

import { UniqueRow } from "../unique-row/unique-row";
import "./unique-table.css";

interface UniqueTableProps { uniques: Item[] }

/** Tabla de únicos: una <UniqueRow> por objeto. */
export const UniqueTable: Component<UniqueTableProps, HTMLTableElement> = ({ uniques }) => (
  <table class="uniques">
    <thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th></tr></thead>
    <tbody>{uniques.map(item => <UniqueRow item={item} />)}</tbody>
  </table>
) as HTMLTableElement;
