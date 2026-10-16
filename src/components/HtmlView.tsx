import { highlightMatches } from '../utils/highlight';
import { getValueKind, stringifyInline } from '../utils/json';
import { ValueCell } from './ValueCell';

export interface HtmlViewRow {
  key: string;
  text: string;
  value: unknown;
}

/**
 * Flattens `data` into one row per top-level key (or array index). Strings are shown raw;
 * every other value is stringified as single-line JSON. A primitive root becomes a single row.
 */
export function buildHtmlRows(data: unknown): HtmlViewRow[] {
  const kind = getValueKind(data);
  if (kind === 'object' || kind === 'array') {
    return Object.keys(data as object).map((key) => {
      const value = (data as Record<string, unknown>)[key];
      return { key, text: stringifyInline(value), value };
    });
  }
  return [{ key: '(root)', text: stringifyInline(data), value: data }];
}

export function filterHtmlRows(rows: HtmlViewRow[], term: string): HtmlViewRow[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter(
    (row) => row.key.toLowerCase().includes(needle) || row.text.toLowerCase().includes(needle),
  );
}

export interface HtmlViewProps {
  rows: HtmlViewRow[];
  searchTerm: string;
  showCopyButton: boolean;
}

export function HtmlView({ rows, searchTerm, showCopyButton }: HtmlViewProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <p className="jv-empty">{searchTerm.trim() ? 'No matching keys.' : 'No keys to display.'}</p>
    );
  }

  return (
    <table className="jv-table">
      <thead>
        <tr>
          <th scope="col">Key</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="jv-table-row">
            <th scope="row" className="jv-table-key jv-key">
              {highlightMatches(row.key, searchTerm)}
            </th>
            <td className="jv-table-value">
              <ValueCell
                label={row.key}
                text={row.text}
                value={row.value}
                searchTerm={searchTerm}
                showCopyButton={showCopyButton}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
