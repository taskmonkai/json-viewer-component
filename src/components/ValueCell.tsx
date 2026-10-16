import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { highlightMatches } from '../utils/highlight';
import { getValueKind, safeStringify, stringifyInline } from '../utils/json';
import { canShowAsTable } from '../utils/table';
import { CopyButton } from './CopyButton';
import { ArrayTable } from './TableView';

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
  return { isJson: false, text: stringifyInline(value) };
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
  const tableable = canShowAsTable(value);
  const [asTable, setAsTable] = useState(false);

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
    <div
      className="jv-dialog-backdrop"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
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
          {tableable ? (
            <div className="jv-view-toggle" role="group" aria-label="Popup view">
              <button
                type="button"
                className="jv-btn"
                aria-pressed={!asTable}
                onClick={() => setAsTable(false)}
              >
                JSON
              </button>
              <button
                type="button"
                className="jv-btn"
                aria-pressed={asTable}
                onClick={() => setAsTable(true)}
              >
                Table
              </button>
            </div>
          ) : (
            <span className="jv-dialog-format">{isJson ? 'JSON' : 'Text'}</span>
          )}
          {showCopyButton && (
            <CopyButton getText={() => text} label={`value of ${title}`} className="jv-btn-copy" />
          )}
          <button ref={closeRef} type="button" className="jv-btn" onClick={onClose}>
            Close
          </button>
        </div>
        {tableable && asTable ? (
          <div className="jv-dialog-body">
            <ArrayTable data={value} label={title} searchTerm="" showCopyButton={showCopyButton} />
          </div>
        ) : (
          <pre className={`jv-dialog-body${isJson ? ' jv-dialog-json' : ''}`}>{text}</pre>
        )}
      </div>
    </div>
  );
}

export interface ValueCellProps {
  /** Names the value in accessible labels and the popup title. */
  label: string;
  text: string;
  value: unknown;
  searchTerm: string;
  showCopyButton: boolean;
}

/**
 * One-line, ellipsis-truncated value with a copy button, plus a View button that opens the full
 * value in a popup when it doesn't fit.
 */
export function ValueCell({
  label,
  text,
  value,
  searchTerm,
  showCopyButton,
}: ValueCellProps): JSX.Element {
  const [textRef, overflowing] = useIsOverflowing<HTMLPreElement>(text);
  const [open, setOpen] = useState(false);

  return (
    <div className="jv-table-cell">
      <pre ref={textRef} className="jv-table-pre" title={overflowing ? text : undefined}>
        {highlightMatches(text, searchTerm)}
      </pre>
      {overflowing && (
        <button
          type="button"
          className="jv-btn jv-view-btn"
          onClick={() => setOpen(true)}
          aria-label={`View full value of ${label}`}
        >
          View
        </button>
      )}
      {showCopyButton && <CopyButton getText={() => text} label={`value of ${label}`} />}
      {open && (
        <ValueDialog
          title={label}
          value={value}
          showCopyButton={showCopyButton}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
