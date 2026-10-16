export const basicData = {
  id: 1024,
  name: 'Ada Lovelace',
  active: true,
  balance: 1234.56,
  notes: null,
  tags: ['mathematician', 'writer', 'visionary'],
  address: {
    city: 'London',
    country: 'UK',
    postalCode: 'W1A 1AA',
  },
};

function makeUser(i: number) {
  return {
    id: i,
    username: `user_${i}`,
    email: `user${i}@example.com`,
    isActive: i % 3 !== 0,
    roles: i % 5 === 0 ? ['admin', 'editor'] : ['viewer'],
    profile: {
      firstName: `First${i}`,
      lastName: `Last${i}`,
      bio: i % 2 === 0 ? `Bio for user ${i}` : null,
      address: {
        street: `${i} Main St`,
        city: ['London', 'Berlin', 'Tokyo', 'Austin'][i % 4],
        geo: { lat: 40 + (i % 10), lng: -70 - (i % 10) },
      },
    },
    stats: { logins: i * 3, lastSeen: `2026-0${(i % 9) + 1}-01T00:00:00Z` },
  };
}

export const largeNestedData = {
  meta: { generatedAt: '2026-09-07T00:00:00Z', totalUsers: 200 },
  users: Array.from({ length: 200 }, (_, i) => makeUser(i)),
};

export const circularExample = (() => {
  const node: Record<string, unknown> = { name: 'root-node', child: null };
  const child: Record<string, unknown> = { name: 'child-node', parent: node };
  node.child = child;
  return node;
})();

export const arrayData = [
  { sku: 'A-100', product: 'Keyboard', price: 49.99, inStock: true, tags: ['usb', 'mechanical'] },
  { sku: 'B-200', product: 'Mouse', price: 19.5, inStock: false, tags: ['wireless'] },
  { sku: 'C-300', product: 'Monitor', price: 229, inStock: true, tags: [] },
  'a plain string item',
  42,
  null,
  [1, 2, [3, 4]],
];
