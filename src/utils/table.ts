import { getValueKind, stringifyInline } from './json';

export interface TableCell {
  text: string;
  value: unknown;
}

export interface TableRow {
  index: number;
  /** Cells keyed by column name, for items that are plain objects. */
  cells: Map<string, TableCell>;
  /** The item itself, for items that aren't plain objects (primitives, nested arrays, ...). */
  item?: TableCell;
}

export interface TableModel {
  /** Union of the object items' keys, in first-seen order. */
  columns: string[];
  /** True when at least one item isn't a plain object and needs the "Value" column. */
  hasValueColumn: boolean;
  rows: TableRow[];
}

/** Any non-empty array can be shown as a table: one row per item. */
export function canShowAsTable(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

export function buildTable(items: unknown[]): TableModel {
  const columns: string[] = [];
  const seen = new Set<string>();
  let hasValueColumn = false;

  const rows = items.map((item, index): TableRow => {
    const cells = new Map<string, TableCell>();
    if (getValueKind(item) !== 'object') {
      hasValueColumn = true;
      return { index, cells, item: { text: stringifyInline(item), value: item } };
    }
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
      cells.set(key, { text: stringifyInline(value), value });
    }
    return { index, cells };
  });

  return { columns, hasValueColumn, rows };
}

/** Keeps rows whose index, keys, or cell text contain `term` (case-insensitive). */
export function filterTableRows(rows: TableRow[], term: string): TableRow[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    if (String(row.index).includes(needle)) return true;
    if (row.item?.text.toLowerCase().includes(needle)) return true;
    for (const [key, cell] of row.cells) {
      if (key.toLowerCase().includes(needle) || cell.text.toLowerCase().includes(needle)) {
        return true;
      }
    }
    return false;
  });
}
