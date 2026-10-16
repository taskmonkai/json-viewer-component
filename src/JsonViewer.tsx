import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { JsonViewerProps, ViewMode } from './types';
import { getValueKind } from './utils/json';
import { buildSearchIndex } from './utils/search';
import { SearchContext } from './SearchContext';
import { Toolbar } from './components/Toolbar';
import { JsonNode } from './components/JsonNode';
import { HtmlView, buildHtmlRows, filterHtmlRows } from './components/HtmlView';
import { ArrayTable } from './components/TableView';
import { buildTable, canShowAsTable, filterTableRows } from './utils/table';
import { injectStylesOnce } from './styles';

const NO_ANCESTORS: ReadonlySet<object> = new Set();

export function JsonViewer({
  data,
  defaultExpandDepth = 1,
  expandAll = false,
  showCopyButton = true,
  showSearch = true,
  defaultView = 'tree',
  showViewToggle = true,
  theme = 'light',
  className,
  id,
}: JsonViewerProps): JSX.Element {
  useEffect(() => {
    injectStylesOnce();
  }, []);

  const instanceId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<ViewMode>(defaultView);
  const [treeVersion, setTreeVersion] = useState(0);
  const [forcedExpanded, setForcedExpanded] = useState<boolean | undefined>(undefined);

  const handleExpandAll = useCallback(() => {
    setForcedExpanded(true);
    setTreeVersion((v) => v + 1);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setForcedExpanded(false);
    setTreeVersion((v) => v + 1);
  }, []);

  const tableAvailable = canShowAsTable(data);
  // A 'table' view only makes sense for array data; anything else falls back to the tree.
  const activeView: ViewMode = view === 'table' && !tableAvailable ? 'tree' : view;

  const searchIndex = useMemo(
    () => (activeView === 'tree' ? buildSearchIndex(data, searchTerm) : null),
    [data, searchTerm, activeView],
  );
  const htmlRows = useMemo(
    () => (activeView === 'html' ? buildHtmlRows(data) : []),
    [data, activeView],
  );
  const visibleHtmlRows = useMemo(
    () => filterHtmlRows(htmlRows, searchTerm),
    [htmlRows, searchTerm],
  );
  const tableModel = useMemo(
    () => (activeView === 'table' && canShowAsTable(data) ? buildTable(data) : null),
    [data, activeView],
  );
  const visibleTableRowCount = useMemo(
    () => (tableModel ? filterTableRows(tableModel.rows, searchTerm).length : 0),
    [tableModel, searchTerm],
  );

  const rootClassName = `jv-root${className ? ` ${className}` : ''}`;

  if (data === undefined) {
    return (
      <div className={rootClassName} data-theme={theme} id={id}>
        <p className="jv-empty">No data to display.</p>
      </div>
    );
  }

  const rootKind = getValueKind(data);
  if (rootKind === 'unknown' || rootKind === 'function') {
    return (
      <div className={rootClassName} data-theme={theme} id={id}>
        <p className="jv-error" role="alert">
          Unsupported data provided to JsonViewer (received type &quot;{typeof data}&quot;).
        </p>
      </div>
    );
  }

  return (
    <div className={rootClassName} data-theme={theme} id={id}>
      <Toolbar
        showSearch={showSearch}
        showCopyButton={showCopyButton}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        matchCount={
          searchIndex
            ? searchIndex.matches.size
            : tableModel
              ? visibleTableRowCount
              : visibleHtmlRows.length
        }
        data={data}
        instanceId={instanceId}
        view={activeView}
        showViewToggle={showViewToggle}
        tableAvailable={tableAvailable}
        onViewChange={setView}
      />
      <div className="jv-tree-container">
        {searchIndex ? (
          <SearchContext.Provider value={{ term: searchTerm, index: searchIndex, showCopyButton }}>
            <ul className="jv-tree" role="tree" aria-label="JSON data">
              <JsonNode
                key={treeVersion}
                name={null}
                value={data}
                path={[]}
                depth={0}
                defaultExpandDepth={defaultExpandDepth}
                expandAll={expandAll}
                forcedExpanded={forcedExpanded}
                ancestors={NO_ANCESTORS}
              />
            </ul>
          </SearchContext.Provider>
        ) : tableModel ? (
          <ArrayTable
            data={data as unknown[]}
            model={tableModel}
            label=""
            searchTerm={searchTerm}
            showCopyButton={showCopyButton}
            filter
          />
        ) : (
          <HtmlView
            rows={visibleHtmlRows}
            searchTerm={searchTerm}
            showCopyButton={showCopyButton}
          />
        )}
      </div>
    </div>
  );
}
