import { useState } from 'react';
import { JsonViewer } from 'tm-json-viewer-lite';
import { arrayData, basicData, circularExample, largeNestedData } from './sampleData';
import './App.css';

export function App() {
  const [dark, setDark] = useState(false);

  return (
    <div className="demo-app" data-dark={dark}>
      <header className="demo-header">
        <h1>tm-json-viewer-lite</h1>
        <p>A lightweight, themeable, accessible JSON tree viewer for React.</p>
      </header>

      <div className="demo-toggle">
        <button onClick={() => setDark((d) => !d)}>
          Switch to {dark ? 'light' : 'dark'} theme (applies to every viewer below)
        </button>
      </div>

      <section className="demo-section">
        <h2>1. Basic viewer</h2>
        <p className="demo-desc">
          A flat-ish object with strings, numbers, booleans, null, an array, and a nested object.
        </p>
        <JsonViewer data={basicData} theme={dark ? 'dark' : 'light'} />
      </section>

      <section className="demo-section">
        <h2>2. Large nested JSON</h2>
        <p className="demo-desc">
          200 users, each with nested profile/address/geo data (~1500+ nodes). Only visible nodes
          render, so expanding/collapsing stays fast.
        </p>
        <JsonViewer data={largeNestedData} theme={dark ? 'dark' : 'light'} defaultExpandDepth={1} />
      </section>

      <section className="demo-section">
        <h2>3. Search</h2>
        <p className="demo-desc">
          Try searching for a key like &quot;email&quot;, or a value like &quot;Berlin&quot; &mdash;
          matches are highlighted and their ancestors auto-expand.
        </p>
        <JsonViewer data={largeNestedData} theme={dark ? 'dark' : 'light'} defaultExpandDepth={0} />
      </section>

      <section className="demo-section">
        <h2>4. Expand / collapse controls</h2>
        <p className="demo-desc">
          Click a row&apos;s chevron to toggle it individually, or use the toolbar&apos;s Expand All
          / Collapse All. This instance starts fully expanded.
        </p>
        <JsonViewer data={basicData} theme={dark ? 'dark' : 'light'} expandAll />
      </section>

      <section className="demo-section">
        <h2>5. Copy to clipboard</h2>
        <p className="demo-desc">
          Hover (or tab-focus) any row to reveal its copy icon. Strings copy without quotes;
          objects/arrays copy as formatted JSON. The toolbar icon copies the entire document.
        </p>
        <JsonViewer data={basicData} theme={dark ? 'dark' : 'light'} />
      </section>

      <section className="demo-section">
        <h2>6. Theme &amp; customization</h2>
        <p className="demo-desc">
          Beyond the built-in light/dark themes, override CSS variables via <code>className</code>{' '}
          for a fully custom palette:
        </p>
        <pre className="demo-css">{`.custom-theme-viewer {
  --jv-key: #7c3aed;
  --jv-string: #059669;
  --jv-number: #d97706;
}`}</pre>
        <JsonViewer
          data={basicData}
          className="custom-theme-viewer"
          theme={dark ? 'dark' : 'light'}
        />
      </section>

      <section className="demo-section">
        <h2>7. HTML view</h2>
        <p className="demo-desc">
          Use the toolbar&apos;s Tree / HTML switch, or <code>defaultView=&quot;html&quot;</code>,
          to see top-level keys in a table with each value stringified.
        </p>
        <JsonViewer data={basicData} theme={dark ? 'dark' : 'light'} defaultView="html" />
      </section>

      <section className="demo-section">
        <h2>8. Array root</h2>
        <p className="demo-desc">
          A top-level array mixing objects, primitives, null, and nested arrays, starting in the
          Table view (<code>defaultView=&quot;table&quot;</code>): one row per item, a column per
          key, and a Value column for non-object items. In the Tree view, nested arrays like{' '}
          <code>tags</code> get their own Table button too.
        </p>
        <JsonViewer data={arrayData} theme={dark ? 'dark' : 'light'} defaultView="table" />
      </section>

      <section className="demo-section">
        <h2>9. Edge cases</h2>
        <p className="demo-desc">Empty object, empty array, null root, and a circular reference.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <JsonViewer data={{}} theme={dark ? 'dark' : 'light'} showSearch={false} />
          <JsonViewer data={[]} theme={dark ? 'dark' : 'light'} showSearch={false} />
          <JsonViewer data={null} theme={dark ? 'dark' : 'light'} showSearch={false} />
          <JsonViewer
            data={circularExample}
            theme={dark ? 'dark' : 'light'}
            expandAll
            showSearch={false}
          />
        </div>
      </section>
    </div>
  );
}
