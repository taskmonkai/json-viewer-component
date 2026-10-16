import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonViewer } from '../JsonViewer';

/**
 * The copy button is only reachable by pointer once its row is `:hover`ed (via CSS
 * `pointer-events`), which @testing-library/user-event's realistic pointer simulation enforces.
 * Copy-button tests exercise the click handler directly with fireEvent instead of simulating
 * hover; @testing-library/user-event also installs its own clipboard stub as soon as `setup()`
 * runs, so we stub navigator.clipboard ourselves here rather than mixing the two.
 */
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

/** Lets the microtask queue (e.g. a resolved clipboard promise) drain before assertions run. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('JsonViewer - basic rendering', () => {
  it('renders a simple flat object with keys and primitive values', () => {
    render(<JsonViewer data={{ name: 'Alice', age: 30, active: true }} />);

    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('renders nested objects, collapsed beyond the default expand depth', () => {
    render(<JsonViewer data={{ user: { profile: { city: 'NYC' } } }} defaultExpandDepth={1} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    // depth 1 (the "user" object's children) should not be expanded by default.
    expect(screen.queryByText('profile')).not.toBeInTheDocument();
  });

  it('renders arrays with numeric indexes', () => {
    render(<JsonViewer data={['a', 'b', 'c']} defaultExpandDepth={2} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('handles deeply nested JSON without crashing', () => {
    let deep: unknown = 'bottom';
    for (let i = 0; i < 50; i++) deep = { child: deep };

    render(<JsonViewer data={deep} expandAll />);
    expect(screen.getAllByText('child').length).toBeGreaterThan(0);
    expect(screen.getByText('bottom')).toBeInTheDocument();
  });
});

describe('JsonViewer - expand/collapse', () => {
  it('toggles an individual node open and closed', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ user: { city: 'NYC' } }} defaultExpandDepth={1} />);

    expect(screen.queryByText('city')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /expand user/i });
    await user.click(toggle);
    expect(screen.getByText('city')).toBeInTheDocument();

    const collapse = screen.getByRole('button', { name: /collapse user/i });
    await user.click(collapse);
    expect(screen.queryByText('city')).not.toBeInTheDocument();
  });

  it('Expand All reveals nested nodes and Collapse All hides them', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ a: { b: { c: 1 } } }} defaultExpandDepth={1} />);

    expect(screen.queryByText('c')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand All' }));
    expect(screen.getByText('c')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse All' }));
    expect(screen.queryByText('b')).not.toBeInTheDocument();
  });
});

describe('JsonViewer - search', () => {
  it('finds a match by key name and shows a match count', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ user: { email: 'a@b.com' }, other: 1 }} defaultExpandDepth={0} />);

    const input = screen.getByPlaceholderText(/search keys or values/i);
    await user.type(input, 'email');

    expect(screen.getByText('1 match')).toBeInTheDocument();
    // Ancestor ("user") should be auto-expanded to reveal the match.
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('finds a match by value and highlights it', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ city: 'San Francisco' }} />);

    const input = screen.getByPlaceholderText(/search keys or values/i);
    await user.type(input, 'francisco');

    const mark = document.querySelector('mark.jv-mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent?.toLowerCase()).toBe('francisco');
  });

  it('shows no matches for a term not present', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ a: 1 }} />);

    await user.type(screen.getByPlaceholderText(/search keys or values/i), 'zzz-not-found');
    expect(screen.getByText('0 matches')).toBeInTheDocument();
  });

  it('hides the search box when showSearch is false', () => {
    render(<JsonViewer data={{ a: 1 }} showSearch={false} />);
    expect(screen.queryByPlaceholderText(/search keys or values/i)).not.toBeInTheDocument();
  });
});

describe('JsonViewer - copy to clipboard', () => {
  it('copies a string value without surrounding quotes', async () => {
    const writeText = stubClipboard();
    render(<JsonViewer data={{ name: 'Alice' }} />);

    fireEvent.click(screen.getByRole('button', { name: /copy value of name/i }));
    expect(writeText).toHaveBeenCalledWith('Alice');
    await act(flushMicrotasks);
  });

  it('copies numbers, booleans and null using their textual representation', async () => {
    const writeText = stubClipboard();
    render(<JsonViewer data={{ n: 42, b: false, x: null }} />);

    fireEvent.click(screen.getByRole('button', { name: /copy value of n\b/i }));
    expect(writeText).toHaveBeenCalledWith('42');

    fireEvent.click(screen.getByRole('button', { name: /copy value of b/i }));
    expect(writeText).toHaveBeenCalledWith('false');

    fireEvent.click(screen.getByRole('button', { name: /copy value of x/i }));
    expect(writeText).toHaveBeenCalledWith('null');
    await act(flushMicrotasks);
  });

  it('copies an object/array as formatted JSON', async () => {
    const writeText = stubClipboard();
    render(<JsonViewer data={{ user: { id: 1 } }} />);

    fireEvent.click(screen.getByRole('button', { name: /copy value of user/i }));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ id: 1 }, null, 2));
    await act(flushMicrotasks);
  });

  it('shows a confirmation after copying and does not toggle the row', async () => {
    stubClipboard();
    render(<JsonViewer data={{ user: { city: 'NYC' } }} defaultExpandDepth={1} />);

    fireEvent.click(screen.getByRole('button', { name: /copy value of user/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied value of user/i })).toBeInTheDocument();
    });
    // Clicking copy must not expand the collapsed "user" node.
    expect(screen.queryByText('city')).not.toBeInTheDocument();
  });

  it('provides a toolbar button to copy the entire JSON document', async () => {
    const writeText = stubClipboard();
    const data = { a: 1, b: [1, 2] };
    render(<JsonViewer data={data} />);

    fireEvent.click(screen.getByRole('button', { name: /copy entire json/i }));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    await act(flushMicrotasks);
  });
});

describe('JsonViewer - empty, null and primitive data', () => {
  it('renders an empty object gracefully', () => {
    render(<JsonViewer data={{}} />);
    expect(screen.getByText('{}')).toBeInTheDocument();
  });

  it('renders an empty array gracefully', () => {
    render(<JsonViewer data={[]} />);
    expect(screen.getByText('[]')).toBeInTheDocument();
  });

  it('renders a null root value', () => {
    render(<JsonViewer data={null} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders primitive root values (string, number, boolean)', () => {
    const { rerender } = render(<JsonViewer data="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();

    rerender(<JsonViewer data={123} />);
    expect(screen.getByText('123')).toBeInTheDocument();

    rerender(<JsonViewer data={false} />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});

describe('JsonViewer - invalid input handling', () => {
  it('shows a helpful message when data is undefined', () => {
    render(<JsonViewer data={undefined} />);
    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();
  });

  it('shows an error message for unsupported data types', () => {
    render(<JsonViewer data={Symbol('x')} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/unsupported data/i);
  });

  it('does not crash on circular references and marks only the back-reference', () => {
    const obj: Record<string, unknown> = { name: 'root' };
    obj.self = obj;

    render(<JsonViewer data={obj} expandAll />);
    // The root itself must still render normally...
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    // ...only the "self" back-reference collapses to the circular marker.
    expect(screen.getByText('[Circular Reference]')).toBeInTheDocument();
  });

  it('renders every occurrence of a repeated (non-cyclic) object reference normally', () => {
    const shared = { shared: true };
    render(<JsonViewer data={{ a: shared, b: shared }} expandAll />);
    expect(screen.getAllByText('shared').length).toBe(2);
    expect(screen.queryByText('[Circular Reference]')).not.toBeInTheDocument();
  });
});

describe('JsonViewer - customization', () => {
  it('applies the provided className and theme', () => {
    const { container } = render(<JsonViewer data={{ a: 1 }} className="my-viewer" theme="dark" />);
    const root = container.querySelector('.jv-root');
    expect(root).toHaveClass('my-viewer');
    expect(root).toHaveAttribute('data-theme', 'dark');
  });

  it('hides the copy buttons when showCopyButton is false', () => {
    render(<JsonViewer data={{ name: 'Alice' }} showCopyButton={false} />);
    expect(screen.queryByRole('button', { name: /copy value of name/i })).not.toBeInTheDocument();
  });

  it('expands every node up front when expandAll is set', () => {
    render(<JsonViewer data={{ a: { b: { c: 1 } } }} expandAll />);
    expect(screen.getByText('c')).toBeInTheDocument();
  });
});

describe('JsonViewer - accessibility', () => {
  it('exposes expand/collapse controls with aria-expanded', () => {
    render(<JsonViewer data={{ user: { city: 'NYC' } }} defaultExpandDepth={1} />);
    const toggle = screen.getByRole('button', { name: /expand user/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the tree with an accessible tree role', () => {
    render(<JsonViewer data={{ a: 1 }} />);
    expect(screen.getByRole('tree', { name: /json data/i })).toBeInTheDocument();
  });

  it('labels the search input for screen readers', () => {
    render(<JsonViewer data={{ a: 1 }} />);
    expect(screen.getByLabelText(/search json keys and values/i)).toBeInTheDocument();
  });
});

describe('JsonViewer - HTML view', () => {
  it('shows top-level keys with stringified values in a table', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ name: 'Alice', tags: ['a', 'b'], meta: { id: 1 } }} />);

    await user.click(screen.getByRole('button', { name: 'HTML' }));

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'name' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('["a","b"]')).toBeInTheDocument();
    expect(screen.getByText('{"id":1}')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand all/i })).not.toBeInTheDocument();
  });

  it('starts in HTML view via defaultView and filters rows by search', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ city: 'Berlin', country: 'DE' }} defaultView="html" />);

    expect(screen.getAllByRole('row')).toHaveLength(3);
    await user.type(screen.getByRole('searchbox'), 'berlin');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('1 match')).toBeInTheDocument();
  });

  it('hides the view toggle when showViewToggle is false', () => {
    render(<JsonViewer data={{ a: 1 }} showViewToggle={false} />);
    expect(screen.queryByRole('button', { name: 'HTML' })).not.toBeInTheDocument();
  });
});

describe('JsonViewer - HTML view overflow popup', () => {
  /** jsdom has no layout, so fake every element being wider than its box. */
  function fakeOverflow() {
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    return () => {
      scroll.mockRestore();
      client.mockRestore();
    };
  }

  it('does not offer a popup when the value fits', () => {
    render(<JsonViewer data={{ a: 1 }} defaultView="html" />);
    expect(screen.queryByRole('button', { name: /view full value/i })).not.toBeInTheDocument();
  });

  it('shows nested values as pretty JSON in the popup', async () => {
    const restore = fakeOverflow();
    const user = userEvent.setup();
    render(<JsonViewer data={{ meta: { id: 1, tags: ['x'] } }} defaultView="html" />);

    await user.click(screen.getByRole('button', { name: 'View full value of meta' }));
    const dialog = screen.getByRole('dialog', { name: 'Value of meta' });
    expect(dialog).toHaveTextContent('JSON');
    expect(dialog.querySelector('pre')?.textContent).toBe(
      JSON.stringify({ id: 1, tags: ['x'] }, null, 2),
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    restore();
  });

  it('shows plain strings as text and JSON strings as JSON', async () => {
    const restore = fakeOverflow();
    const user = userEvent.setup();
    render(<JsonViewer data={{ note: 'hello world', raw: '{"k":true}' }} defaultView="html" />);

    await user.click(screen.getByRole('button', { name: 'View full value of note' }));
    let dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Text');
    expect(dialog.querySelector('pre')?.textContent).toBe('hello world');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await user.click(screen.getByRole('button', { name: 'View full value of raw' }));
    dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('pre')?.textContent).toBe('{\n  "k": true\n}');
    restore();
  });
});

describe('JsonViewer - table view', () => {
  const people = [{ name: 'Ada', city: 'London' }, { name: 'Alan', age: 41 }, 'not an object'];

  it('offers a Table view only for non-empty arrays', () => {
    const { rerender } = render(<JsonViewer data={people} />);
    expect(screen.getByRole('button', { name: 'Table' })).toBeInTheDocument();

    rerender(<JsonViewer data={{ a: 1 }} />);
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();

    rerender(<JsonViewer data={[]} />);
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();
  });

  it('shows one row per item with a column per key and a Value column', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={people} />);
    await user.click(screen.getByRole('button', { name: 'Table' }));

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['#', 'name', 'city', 'age', 'Value']);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('not an object')).toBeInTheDocument();
  });

  it('filters rows by search and reports the row count', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={people} defaultView="table" />);

    await user.type(screen.getByRole('searchbox'), 'london');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('1 match')).toBeInTheDocument();
  });

  it('falls back to the tree when defaultView="table" is given non-array data', () => {
    render(<JsonViewer data={{ a: 1 }} defaultView="table" />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('lets nested arrays in the tree switch to a table', async () => {
    const user = userEvent.setup();
    render(<JsonViewer data={{ users: [{ id: 1 }, { id: 2 }] }} />);

    await user.click(screen.getByRole('button', { name: 'Show users as table' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['#', 'id']);

    await user.click(screen.getByRole('button', { name: 'Show users as table' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('can show an array value as a table in the popup', async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    const user = userEvent.setup();
    render(<JsonViewer data={{ rows: [{ x: 1 }, { x: 2 }] }} defaultView="html" />);

    await user.click(screen.getByRole('button', { name: 'View full value of rows' }));
    const dialog = screen.getByRole('dialog', { name: 'Value of rows' });
    await user.click(within(dialog).getByRole('button', { name: 'Table' }));
    expect(within(dialog).getByRole('table')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('row')).toHaveLength(3);
    scroll.mockRestore();
    client.mockRestore();
  });
});
