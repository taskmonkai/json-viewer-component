import type { ValueKind } from '../types';

export function getValueKind(value: unknown): ValueKind {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'function') return 'function';
  if (t === 'object') return 'object';
  return 'unknown';
}

/** Value shown when copying a leaf: strings copy raw (no quotes), others copy their textual form. */
export function copyTextForPrimitive(value: unknown, kind: ValueKind): string {
  if (kind === 'string') return value as string;
  if (kind === 'null') return 'null';
  if (kind === 'undefined') return 'undefined';
  return String(value);
}

export function safeStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
      return val;
    },
    indent,
  );
}

/** Single-line text for a value in a table cell: strings raw, everything else compact JSON. */
export function stringifyInline(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  return safeStringify(value, 0);
}
