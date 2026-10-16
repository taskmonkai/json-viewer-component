# tm-json-viewer-lite

A lightweight, dependency-free React component for viewing JSON data as an expandable,
searchable, syntax-highlighted tree. Ships as ESM + CommonJS with TypeScript declarations, and
injects its own styles at runtime — no CSS import or bundler config required.

> Rename the package (in `package.json`) before publishing to npm if you need a unique name.

## Features

- Expandable/collapsible tree for objects, arrays, strings, numbers, booleans, and `null`
- "Expand All" / "Collapse All" toolbar actions
- Search box with match count and inline highlighting (auto-expands ancestors of a match)
- Copy-to-clipboard on every value (and the whole document), with a "copied" confirmation
- Light/dark theme, plus CSS variables for full customization
- Graceful handling of empty objects/arrays, circular references, and invalid input
- Keyboard-accessible controls with ARIA labels

## Installation

```bash
npm install tm-json-viewer-lite
```

`react` and `react-dom` (>=17) are peer dependencies and must already be installed in your app.

## Usage

```tsx
import { JsonViewer } from 'tm-json-viewer-lite';

const data = {
  id: 1,
  name: 'Ada Lovelace',
  active: true,
  tags: ['mathematician', 'writer'],
  address: { city: 'London', country: 'UK' },
  notes: null,
};

export function Example() {
  return <JsonViewer data={data} />;
}
```

### Dark theme

```tsx
<JsonViewer data={data} theme="dark" />
```

### Start fully expanded, hide search

```tsx
<JsonViewer data={data} expandAll showSearch={false} />
```

### Control the default expand depth

```tsx
{
  /* Only the root node starts open; everything below it starts collapsed. */
}
<JsonViewer data={data} defaultExpandDepth={1} />;
```

## Props

| Prop                 | Type                          | Default   | Description                                                                                    |
| -------------------- | ----------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `data`               | `unknown`                     | —         | The value to render. Objects, arrays, strings, numbers, booleans, `null`.                      |
| `defaultExpandDepth` | `number`                      | `1`       | Depth up to which nodes start expanded (`0` = only the root).                                  |
| `expandAll`          | `boolean`                     | `false`   | Start every node expanded, overriding `defaultExpandDepth`.                                    |
| `showCopyButton`     | `boolean`                     | `true`    | Show copy-to-clipboard controls on values and the toolbar.                                     |
| `showSearch`         | `boolean`                     | `true`    | Show the search box in the toolbar.                                                            |
| `defaultView`        | `'tree' \| 'html' \| 'table'` | `'tree'`  | Initial view: expandable tree, HTML table of top-level keys, or array table (array data only). |
| `showViewToggle`     | `boolean`                     | `true`    | Show the Tree / HTML / Table view switch in the toolbar.                                       |
| `theme`              | `'light' \| 'dark'`           | `'light'` | Visual theme.                                                                                  |
| `className`          | `string`                      | —         | Extra class name applied to the root element.                                                  |
| `id`                 | `string`                      | —         | `id` applied to the root element.                                                              |

## Copy-to-clipboard behavior

- Hover (or focus) a row to reveal its copy icon.
- Strings copy their raw text, without the surrounding quotes shown in the tree.
- Numbers, booleans, and `null` copy their textual form (`"42"`, `"true"`, `"null"`).
- Objects and arrays copy their complete value as formatted (`JSON.stringify(value, null, 2)`) JSON.
- The toolbar's copy button copies the entire document the same way.
- After a successful copy, the icon becomes a checkmark for ~1.5s, then reverts automatically.
- Falls back to a hidden-textarea + `document.execCommand('copy')` if the async Clipboard API is
  unavailable (e.g. non-secure contexts, older browsers) or its permission is denied.

## Search

Type in the search box to match against keys, array indexes, or leaf values (case-insensitive
substring match). Matches are highlighted inline, ancestors of a match are auto-expanded, and the
toolbar shows a live match count.

## HTML view

Switch to the HTML view from the toolbar (or start there with `defaultView="html"`) to see the
data as a two-column table: one row per top-level key (or array index), with its value
stringified. Strings are shown as-is; objects, arrays, and other values are shown as single-line
JSON (e.g. `{"id":1,"tags":["a","b"]}`). Search filters the table to rows whose key or value matches.

Values that don't fit on one line are cut off with an ellipsis and get a **View** button that opens
the full value in a popup. In the popup, objects, arrays, and strings containing JSON are
pretty-printed as JSON; everything else is shown as plain text. Close it with the Close button,
<kbd>Esc</kbd>, or by clicking outside.

## Table view

Any non-empty array can be shown as a table: one row per item, one column per key found on its
object items (in first-seen order), and a **Value** column for items that aren't plain objects
(strings, numbers, nested arrays, ...). Missing keys leave the cell empty.

- **Array root:** a **Table** button appears in the toolbar's view switch (or start there with
  `defaultView="table"`; for non-array data that falls back to the tree). Search filters the rows.
- **Nested arrays in the tree:** each non-empty array row has a small **Table** button that shows
  that array as a table in place of its children. Click it again to go back to the tree.
- **Popup:** when the View popup is showing an array, switch between **JSON** and **Table**.

Cells are truncated like the HTML view, with a **View** button for long values.

## Customizing the theme

`theme="light"` / `theme="dark"` switch a set of CSS custom properties scoped to the component's
root element. To customize colors further, override the variables yourself via `className`:

```css
.my-viewer {
  --jv-key: #7c3aed;
  --jv-string: #059669;
  --jv-bg: #fafafa;
}
```

```tsx
<JsonViewer data={data} className="my-viewer" />
```

See `src/styles.ts` for the full list of variables.

## Accessibility

- Expand/collapse controls are real `<button>` elements with `aria-expanded` and descriptive
  `aria-label`s, operable with <kbd>Tab</kbd> and <kbd>Enter</kbd>/<kbd>Space</kbd>.
- The tree root has `role="tree"`; each row is a semantic list item.
- Copy buttons remain visible and reachable when focused via keyboard, even though they're
  hidden until hover on a pointer device.
- The search input has an associated (visually hidden) `<label>` and a live match-count region.

## Handling invalid or unusual data

- `data={undefined}` renders a "No data to display" message.
- A value of an unsupported type (e.g. a `Symbol` or a bare function passed as the root) renders
  an inline error message instead of throwing.
- Circular references are detected and rendered as `[Circular Reference]` instead of recursing
  forever.

## Development

```bash
npm install
npm run dev      # demo app at http://localhost:5173
npm run lint
npm test
npm run build     # builds dist/ (ESM + CJS + .d.ts)
npm run build:demo
```

## License

MIT

# tm-json-viewer
