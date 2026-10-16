import { useMemo } from 'react';
import { highlightMatches } from '../utils/highlight';
import { buildTable, filterTableRows, type TableModel } from '../utils/table';
import { ValueCell } from './ValueCell';

export interface ArrayTableProps {
  /** A non-empty array (see canShowAsTable). */
  data: unknown[];
  /** Pre-built model for `data`, when the caller already has one. */
  model?: TableModel;
  /** Names the array in cell labels, e.g. "users" gives "users[3].email". Empty for the root. */
  label: string;
  searchTerm: string;
  showCopyButton: boolean;
  /** Hide rows that don't match searchTerm (otherwise matches are only highlighted). */
  filter?: boolean;
}

/**
 * Renders an array as a table: one row per item, one column per key found on the object items,
 * and a "Value" column for items that aren't plain objects.
 */
export function ArrayTable({
  data,
  model,
  label,
  searchTerm,
  showCopyButton,
  filter = false,
}: ArrayTableProps): JSX.Element {
  const { columns, hasValueColumn, rows } = useMemo(() => model ?? buildTable(data), [model, data]);
  const visibleRows = filter ? filterTableRows(rows, searchTerm) : rows;

  if (visibleRows.length === 0) {
    return <p className="jv-empty">No matching rows.</p>;
  }

  return (
    <div className="jv-table-scroll">
      <table className="jv-table jv-array-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            {columns.map((column) => (
              <th scope="col" key={column} className="jv-key">
                {highlightMatches(column, searchTerm)}
              </th>
            ))}
            {hasValueColumn && <th scope="col">Value</th>}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const rowLabel = `${label}[${row.index}]`;
            return (
              <tr key={row.index} className="jv-table-row">
                <th scope="row" className="jv-table-key jv-index">
                  {highlightMatches(String(row.index), searchTerm)}
                </th>
                {columns.map((column) => {
                  const cell = row.cells.get(column);
                  return (
                    <td key={column} className="jv-array-cell">
                      {cell && (
                        <ValueCell
                          label={`${rowLabel}.${column}`}
                          text={cell.text}
                          value={cell.value}
                          searchTerm={searchTerm}
                          showCopyButton={showCopyButton}
                        />
                      )}
                    </td>
                  );
                })}
                {hasValueColumn && (
                  <td className="jv-array-cell">
                    {row.item && (
                      <ValueCell
                        label={rowLabel}
                        text={row.item.text}
                        value={row.item.value}
                        searchTerm={searchTerm}
                        showCopyButton={showCopyButton}
                      />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
