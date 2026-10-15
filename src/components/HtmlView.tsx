import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { highlightMatches } from '../utils/highlight';
import { getValueKind, safeStringify } from '../utils/json';
import { CopyButton } from './CopyButton';

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
      return { key, text: stringifyValue(value), value };
    });
  }
  return [{ key: '(root)', text: stringifyValue(data), value: data }];
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  return safeStringify(value, 0);
}

export function filterHtmlRows(rows: HtmlViewRow[], term: string): HtmlViewRow[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter(
    (row) => row.key.toLowerCase().includes(needle) || row.text.toLowerCase().includes(needle),
  );
}

/**
 * Text for the "view full value" popup: objects/arrays (and strings that parse to them) are
 * pretty-printed JSON; anything else is plain text.
 */
export function getPopupContent(value: unknown): { isJson: boolean; text: string } {
  const kind = getValueKind(value);
  if (kind === 'object' || kind === 'array') return { isJson: true, text: safeStringify(value) };
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return { isJson: true, text: safeStringify(JSON.parse(trimmed)) };
      } catch {
        // Not JSON - fall through to plain text.
      }
    }
    return { isJson: false, text: value };
  }
  return { isJson: false, text: stringifyValue(value) };
}

/** Tracks whether an element's content is wider than its box (i.e. it's being truncated). */
function useIsOverflowing<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return [ref, overflowing] as const;
}

interface ValueDialogProps {
  title: string;
  value: unknown;
  showCopyButton: boolean;
  onClose: () => void;
}

function ValueDialog({ title, value, showCopyButton, onClose }: ValueDialogProps): JSX.Element {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { isJson, text } = getPopupContent(value);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div className="jv-dialog-backdrop" onClick={onClose}>
      <div
        className="jv-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Value of ${title}`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="jv-dialog-header">
          <span className="jv-dialog-title jv-key">{title}</span>
          <span className="jv-dialog-format">{isJson ? 'JSON' : 'Text'}</span>
          {showCopyButton && (
            <CopyButton getText={() => text} label={`value of ${title}`} className="jv-btn-copy" />
          )}
          <button ref={closeRef} type="button" className="jv-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <pre className={`jv-dialog-body${isJson ? ' jv-dialog-json' : ''}`}>{text}</pre>
      </div>
    </div>
  );
}

interface HtmlViewRowProps {
  row: HtmlViewRow;
  searchTerm: string;
  showCopyButton: boolean;
  onView: (row: HtmlViewRow) => void;
}

function HtmlViewRowItem({ row, searchTerm, showCopyButton, onView }: HtmlViewRowProps) {
  const [textRef, overflowing] = useIsOverflowing<HTMLPreElement>(row.text);

  return (
    <tr className="jv-table-row">
      <th scope="row" className="jv-table-key jv-key">
        {highlightMatches(row.key, searchTerm)}
      </th>
      <td className="jv-table-value">
        <div className="jv-table-cell">
          <pre ref={textRef} className="jv-table-pre" title={overflowing ? row.text : undefined}>
            {highlightMatches(row.text, searchTerm)}
          </pre>
          {overflowing && (
            <button
              type="button"
              className="jv-btn jv-view-btn"
              onClick={() => onView(row)}
              aria-label={`View full value of ${row.key}`}
            >
              View
            </button>
          )}
          {showCopyButton && <CopyButton getText={() => row.text} label={`value of ${row.key}`} />}
        </div>
      </td>
    </tr>
  );
}

export interface HtmlViewProps {
  rows: HtmlViewRow[];
  searchTerm: string;
  showCopyButton: boolean;
}

export function HtmlView({ rows, searchTerm, showCopyButton }: HtmlViewProps): JSX.Element {
  const [openRow, setOpenRow] = useState<HtmlViewRow | null>(null);

  if (rows.length === 0) {
    return (
      <p className="jv-empty">{searchTerm.trim() ? 'No matching keys.' : 'No keys to display.'}</p>
    );
  }

  return (
    <>
      <table className="jv-table">
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <HtmlViewRowItem
              key={row.key}
              row={row}
              searchTerm={searchTerm}
              showCopyButton={showCopyButton}
              onView={setOpenRow}
            />
          ))}
        </tbody>
      </table>
      {openRow && (
        <ValueDialog
          title={openRow.key}
          value={openRow.value}
          showCopyButton={showCopyButton}
          onClose={() => setOpenRow(null)}
        />
      )}
    </>
  );
}
