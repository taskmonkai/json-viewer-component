export type JsonPrimitive = string | number | boolean | null | undefined;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue } | object;

export type ValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'circular'
  | 'function'
  | 'unknown';

export type PathSegment = string | number;

export type Theme = 'light' | 'dark';

/** 'tree' = expandable tree; 'html' = table of top-level keys with stringified values. */
export type ViewMode = 'tree' | 'html';

export interface JsonViewerProps {
  /** The JSON-serializable data to render. */
  data: unknown;
  /** Depth (0 = only root's direct children) up to which nodes start expanded. Default: 1. */
  defaultExpandDepth?: number;
  /** Force every node to render fully expanded, overriding defaultExpandDepth. */
  expandAll?: boolean;
  /** Show the copy-to-clipboard affordance on values and the toolbar. Default: true. */
  showCopyButton?: boolean;
  /** Show the search box in the toolbar. Default: true. */
  showSearch?: boolean;
  /** View shown on first render. Default: 'tree'. */
  defaultView?: ViewMode;
  /** Show the Tree / HTML view switcher in the toolbar. Default: true. */
  showViewToggle?: boolean;
  /** Visual theme. Default: 'light'. */
  theme?: Theme;
  /** Additional class name applied to the root element. */
  className?: string;
  /** Root element id, useful for aria-labelledby wiring. */
  id?: string;
}
