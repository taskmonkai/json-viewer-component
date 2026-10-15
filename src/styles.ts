export const STYLE_ELEMENT_ID = 'jv-json-viewer-styles';

export const CSS = `
.jv-root {
  --jv-bg: #ffffff;
  --jv-fg: #1f2328;
  --jv-border: #e2e5e9;
  --jv-muted: #6e7781;
  --jv-key: #953800;
  --jv-string: #0a6e31;
  --jv-number: #1257c9;
  --jv-boolean: #a626a4;
  --jv-null: #b0472e;
  --jv-bracket: #6e7781;
  --jv-mark-bg: #fff2a8;
  --jv-mark-fg: #1f2328;
  --jv-row-hover: #f6f8fa;
  --jv-row-match: #fff7d6;
  --jv-focus: #1257c9;
  --jv-btn-bg: #f6f8fa;
  --jv-btn-border: #d0d7de;

  background: var(--jv-bg);
  color: var(--jv-fg);
  border: 1px solid var(--jv-border);
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
  box-sizing: border-box;
}
.jv-root[data-theme='dark'] {
  --jv-bg: #0d1117;
  --jv-fg: #e6edf3;
  --jv-border: #30363d;
  --jv-muted: #8b949e;
  --jv-key: #ffa657;
  --jv-string: #7ee787;
  --jv-number: #79c0ff;
  --jv-boolean: #d2a8ff;
  --jv-null: #ff7b72;
  --jv-bracket: #8b949e;
  --jv-mark-bg: #665400;
  --jv-mark-fg: #ffe082;
  --jv-row-hover: #161b22;
  --jv-row-match: #3b2f00;
  --jv-focus: #79c0ff;
  --jv-btn-bg: #161b22;
  --jv-btn-border: #30363d;
}
.jv-root *,
.jv-root *::before,
.jv-root *::after {
  box-sizing: border-box;
}
.jv-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--jv-border);
  flex-wrap: wrap;
}
.jv-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 200px;
  min-width: 140px;
}
.jv-search-input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  color: var(--jv-fg);
  background: var(--jv-bg);
  border: 1px solid var(--jv-btn-border);
  border-radius: 6px;
  padding: 4px 8px;
}
.jv-search-input:focus-visible {
  outline: 2px solid var(--jv-focus);
  outline-offset: 1px;
}
.jv-search-count {
  color: var(--jv-muted);
  font-size: 12px;
  white-space: nowrap;
}
.jv-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.jv-btn {
  font: inherit;
  font-size: 12px;
  color: var(--jv-fg);
  background: var(--jv-btn-bg);
  border: 1px solid var(--jv-btn-border);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}
.jv-btn:hover {
  filter: brightness(0.97);
}
.jv-root[data-theme='dark'] .jv-btn:hover {
  filter: brightness(1.15);
}
.jv-btn:focus-visible,
.jv-toggle:focus-visible,
.jv-copy:focus-visible {
  outline: 2px solid var(--jv-focus);
  outline-offset: 1px;
}
.jv-btn-copy {
  position: static;
  opacity: 1;
  background: var(--jv-btn-bg);
  border: 1px solid var(--jv-btn-border);
  border-radius: 6px;
  width: auto;
  height: auto;
  padding: 4px 8px;
}
.jv-btn-copy svg {
  vertical-align: -1px;
}

.jv-view-toggle {
  display: inline-flex;
}
.jv-view-toggle .jv-btn {
  border-radius: 0;
}
.jv-view-toggle .jv-btn:first-child {
  border-radius: 6px 0 0 6px;
}
.jv-view-toggle .jv-btn:last-child {
  border-radius: 0 6px 6px 0;
  margin-left: -1px;
}
.jv-view-toggle .jv-btn[aria-pressed='true'] {
  background: var(--jv-focus);
  border-color: var(--jv-focus);
  color: var(--jv-bg);
}

.jv-tree-container {
  padding: 6px 8px;
  overflow: auto;
  max-height: 480px;
}
.jv-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}
.jv-children {
  list-style: none;
  margin: 0;
  padding-left: 18px;
  border-left: 1px dotted var(--jv-border);
  margin-left: 5px;
}
.jv-row {
  position: relative;
}
.jv-line {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  padding: 1px 4px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}
.jv-line:hover {
  background: var(--jv-row-hover);
}
.jv-line:hover .jv-copy {
  opacity: 1;
  pointer-events: auto;
}
.jv-row-match > .jv-line {
  background: var(--jv-row-match);
}
.jv-close-line {
  padding-left: 4px;
}
.jv-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 20px;
  padding: 0;
  margin-top: 1px;
  background: transparent;
  border: none;
  color: var(--jv-muted);
  cursor: pointer;
}
.jv-toggle-spacer {
  flex: 0 0 auto;
  display: inline-block;
  width: 16px;
}
.jv-chevron {
  transition: transform 0.1s ease;
}
.jv-key {
  color: var(--jv-key);
  font-weight: 600;
}
.jv-index {
  color: var(--jv-muted);
  font-weight: 400;
}
.jv-quote {
  opacity: 0.6;
}
.jv-colon {
  color: var(--jv-muted);
  margin-right: 4px;
}
.jv-value {
  min-width: 0;
}
.jv-string {
  color: var(--jv-string);
}
.jv-number {
  color: var(--jv-number);
}
.jv-boolean {
  color: var(--jv-boolean);
}
.jv-null,
.jv-undefined {
  color: var(--jv-null);
  font-style: italic;
}
.jv-circular,
.jv-function {
  color: var(--jv-muted);
  font-style: italic;
}
.jv-bracket {
  color: var(--jv-bracket);
}
.jv-preview {
  color: var(--jv-muted);
}
.jv-count {
  margin: 0 4px;
  font-size: 12px;
}
.jv-mark {
  background: var(--jv-mark-bg);
  color: var(--jv-mark-fg);
  border-radius: 2px;
  padding: 0 1px;
}

.jv-table {
  width: 100%;
  border-collapse: collapse;
}
.jv-table th,
.jv-table td {
  border: 1px solid var(--jv-border);
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
}
.jv-table thead th {
  color: var(--jv-muted);
  font-weight: 600;
  background: var(--jv-btn-bg);
}
.jv-table-key {
  width: 1%;
  white-space: nowrap;
}
.jv-table-row:hover {
  background: var(--jv-row-hover);
}
.jv-table-row:hover .jv-copy {
  opacity: 1;
  pointer-events: auto;
}
.jv-table-cell {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
}
.jv-table-value {
  width: 100%;
  max-width: 0;
}
.jv-table-pre {
  flex: 1 1 auto;
  margin: 0;
  font: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.jv-view-btn {
  flex: 0 0 auto;
  padding: 0 6px;
  font-size: 11px;
}

.jv-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.45);
}
.jv-dialog {
  display: flex;
  flex-direction: column;
  width: min(720px, 100%);
  max-height: min(80vh, 640px);
  background: var(--jv-bg);
  color: var(--jv-fg);
  border: 1px solid var(--jv-border);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}
.jv-dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--jv-border);
}
.jv-dialog-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jv-dialog-format {
  color: var(--jv-muted);
  font-size: 11px;
  border: 1px solid var(--jv-border);
  border-radius: 4px;
  padding: 0 4px;
}
.jv-dialog-body {
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  font: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}

.jv-copy {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--jv-muted);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s ease;
}
.jv-copy:focus {
  opacity: 1;
  pointer-events: auto;
}
.jv-copy-active {
  color: var(--jv-string);
}

.jv-empty,
.jv-error {
  padding: 16px;
  color: var(--jv-muted);
}
.jv-error {
  color: var(--jv-null);
}
.jv-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

let injected = false;

export function injectStylesOnce(): void {
  if (injected || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}
