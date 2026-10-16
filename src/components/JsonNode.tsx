import { memo, useCallback, useState, type KeyboardEvent } from 'react';
import type { PathSegment } from '../types';
import { copyTextForPrimitive, getValueKind, safeStringify } from '../utils/json';
import { highlightMatches } from '../utils/highlight';
import { pathKey } from '../utils/search';
import { useSearchContext } from '../SearchContext';
import { canShowAsTable } from '../utils/table';
import { CopyButton } from './CopyButton';
import { ArrayTable } from './TableView';
import { ChevronIcon } from './icons';

const MAX_DEPTH = 500;

export interface JsonNodeProps {
  name: PathSegment | null;
  value: unknown;
  path: PathSegment[];
  depth: number;
  defaultExpandDepth: number;
  expandAll: boolean;
  forcedExpanded?: boolean;
  /** Objects currently open on the path from the root down to (not including) this node. */
  ancestors: ReadonlySet<object>;
}

function displayKey(name: PathSegment): string {
  return typeof name === 'number' ? String(name) : name;
}

/** e.g. ['users', 3, 'roles'] -> "users[3].roles" */
function displayPath(path: PathSegment[]): string {
  return path
    .map((seg, i) => (typeof seg === 'number' ? `[${seg}]` : i === 0 ? seg : `.${seg}`))
    .join('');
}

function JsonNodeImpl({
  name,
  value,
  path,
  depth,
  defaultExpandDepth,
  expandAll,
  forcedExpanded,
  ancestors,
}: JsonNodeProps): JSX.Element {
  const { term, index, showCopyButton } = useSearchContext();
  const key = pathKey(path);
  const isCircular = typeof value === 'object' && value !== null && ancestors.has(value);
  const kind = isCircular ? 'circular' : getValueKind(value);
  const isContainer = (kind === 'object' || kind === 'array') && depth < MAX_DEPTH;

  const entries: [PathSegment, unknown][] = isContainer
    ? Array.isArray(value)
      ? value.map((v, i): [PathSegment, unknown] => [i, v])
      : Object.entries(value as Record<string, unknown>)
    : [];
  const count = entries.length;
  const isExpandable = isContainer && count > 0;
  const childAncestors = isContainer ? new Set([...ancestors, value as object]) : ancestors;

  // Nested arrays can switch between child rows and a table; the root uses the toolbar's Table view.
  const tableable = depth > 0 && isContainer && canShowAsTable(value);
  const [asTable, setAsTable] = useState(false);

  const [localExpanded, setLocalExpanded] = useState(
    () => forcedExpanded ?? (expandAll || depth < defaultExpandDepth),
  );

  const forcedOpenBySearch = term.trim() !== '' && index.ancestors.has(key);
  const isOpen = isExpandable && (localExpanded || forcedOpenBySearch);
  const isMatch = term.trim() !== '' && index.matches.has(key);

  // Turning the table on also opens the node; turning it off leaves it open as a tree.
  const showAsTable = useCallback(() => {
    if (isOpen && asTable) {
      setAsTable(false);
    } else {
      setAsTable(true);
      setLocalExpanded(true);
    }
  }, [isOpen, asTable]);

  const toggle = useCallback(() => {
    if (isExpandable) setLocalExpanded((v) => !v);
  }, [isExpandable]);

  const handleToggleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    },
    [toggle],
  );

  const getCopyText = useCallback((): string => {
    if (isContainer) return safeStringify(value);
    if (kind === 'circular') return '[Circular Reference]';
    if (kind === 'function') return '[Function]';
    return copyTextForPrimitive(value, kind);
  }, [isContainer, kind, value]);

  const copyLabel = name !== null ? `value of ${displayKey(name)}` : 'value';
  const rowClassName = `jv-row${isMatch ? ' jv-row-match' : ''}`;

  return (
    <li className={rowClassName} data-depth={depth}>
      <div className="jv-line">
        {isExpandable ? (
          <button
            type="button"
            className="jv-toggle"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? `Collapse ${displayKey(name ?? 'root')}`
                : `Expand ${displayKey(name ?? 'root')}`
            }
            onClick={toggle}
            onKeyDown={handleToggleKeyDown}
          >
            <ChevronIcon expanded={isOpen} />
          </button>
        ) : (
          <span className="jv-toggle-spacer" aria-hidden="true" />
        )}

        {name !== null &&
          (typeof name === 'number' ? (
            <span className="jv-key jv-index">{highlightMatches(String(name), term)}</span>
          ) : (
            <span className="jv-key">
              <span className="jv-quote">&quot;</span>
              <span className="jv-key-text">{highlightMatches(name, term)}</span>
              <span className="jv-quote">&quot;</span>
            </span>
          ))}
        {name !== null && <span className="jv-colon">:</span>}

        <span className="jv-value">
          {isContainer ? (
            <ContainerPreview kind={kind} count={count} isOpen={isOpen} />
          ) : (
            <PrimitiveValue kind={kind} value={value} term={term} />
          )}
        </span>

        {tableable && (
          <button
            type="button"
            className="jv-btn jv-node-view-btn"
            aria-pressed={isOpen && asTable}
            aria-label={`Show ${displayKey(name ?? 'root')} as table`}
            onClick={showAsTable}
          >
            Table
          </button>
        )}

        {showCopyButton && (
          <CopyButton getText={getCopyText} label={copyLabel} className="jv-row-copy" />
        )}
      </div>

      {isOpen && tableable && asTable && (
        <div className="jv-children jv-node-table" role="group">
          <ArrayTable
            data={value as unknown[]}
            label={displayPath(path)}
            searchTerm={term}
            showCopyButton={showCopyButton}
          />
        </div>
      )}

      {isOpen && !(tableable && asTable) && (
        <ul className="jv-children" role="group">
          {entries.map(([childKey, childValue]) => (
            <JsonNode
              key={childKey}
              name={childKey}
              value={childValue}
              path={[...path, childKey]}
              depth={depth + 1}
              defaultExpandDepth={defaultExpandDepth}
              expandAll={expandAll}
              forcedExpanded={forcedExpanded}
              ancestors={childAncestors}
            />
          ))}
        </ul>
      )}

      {isOpen && (
        <div className="jv-line jv-close-line">
          <span className="jv-toggle-spacer" aria-hidden="true" />
          <span className="jv-bracket">{kind === 'array' ? ']' : '}'}</span>
        </div>
      )}
    </li>
  );
}

function ContainerPreview({
  kind,
  count,
  isOpen,
}: {
  kind: string;
  count: number;
  isOpen: boolean;
}): JSX.Element {
  const open = kind === 'array' ? '[' : '{';
  const close = kind === 'array' ? ']' : '}';

  if (count === 0) {
    return (
      <span className="jv-bracket">
        {open}
        {close}
      </span>
    );
  }

  if (isOpen) {
    return <span className="jv-bracket">{open}</span>;
  }

  return (
    <span className="jv-preview">
      <span className="jv-bracket">{open}</span>
      <span className="jv-count">
        {count} {count === 1 ? 'item' : 'items'}
      </span>
      <span className="jv-bracket">{close}</span>
    </span>
  );
}

function PrimitiveValue({
  kind,
  value,
  term,
}: {
  kind: string;
  value: unknown;
  term: string;
}): JSX.Element {
  switch (kind) {
    case 'string':
      return (
        <span className="jv-string">
          <span className="jv-quote">&quot;</span>
          {highlightMatches(value as string, term)}
          <span className="jv-quote">&quot;</span>
        </span>
      );
    case 'number':
      return <span className="jv-number">{highlightMatches(String(value), term)}</span>;
    case 'boolean':
      return <span className="jv-boolean">{highlightMatches(String(value), term)}</span>;
    case 'null':
      return <span className="jv-null">null</span>;
    case 'undefined':
      return <span className="jv-undefined">undefined</span>;
    case 'circular':
      return <span className="jv-circular">[Circular Reference]</span>;
    case 'function':
      return <span className="jv-function">[Function]</span>;
    default:
      return <span className="jv-unknown">{String(value)}</span>;
  }
}

export const JsonNode = memo(JsonNodeImpl);
