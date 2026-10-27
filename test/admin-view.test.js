'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { statsForAdmin, dashboardForAdmin, peopleForAdmin } = require('../admin-view');

test('manager stats contain no financial totals', () => {
  assert.deepEqual(
    statsForAdmin('manager', { members: 12, groups: 3, total: 45000, pending: 4 }),
    { members: 12, groups: 3 }
  );
});

test('manager dashboard omits payment series and finance KPI fields', () => {
  const result = dashboardForAdmin('manager', {
    k: { members: 12, pending_members: 2, groups: 3, total: 45000, pending_pay: 4 },
    pay: [{ d: '2026-10-01', total: 10000, n: 2 }],
    reg: [{ d: '2026-10-02', n: 1 }]
  });
  assert.deepEqual(result, {
    k: { members: 12, pending_members: 2, groups: 3 },
    pay: [],
    reg: [{ d: '2026-10-02', n: 1 }]
  });
});

test('manager member records omit per-member financial details', () => {
  assert.deepEqual(
    peopleForAdmin('manager', [{ id: 4, name: 'Membre', total: 50000, n: 3 }]),
    [{ id: 4, name: 'Membre' }]
  );
});

test('accountant and auditor responses retain authorised finance details', () => {
  const stats = { members: 12, groups: 3, total: 45000, pending: 4 };
  assert.equal(statsForAdmin('accountant', stats), stats);
  const people = [{ id: 4, name: 'Membre', total: 50000, n: 3 }];
  assert.equal(peopleForAdmin('auditor', people), people);
});
