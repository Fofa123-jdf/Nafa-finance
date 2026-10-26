'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { adminRouteAllowed } = require('../access-control');

const cases = [
  ['administrator can manage staff', 'admin', 'POST', '/api/admin/staff', true],
  ['manager can view groups', 'manager', 'GET', '/api/admin/groups', true],
  ['manager cannot view financial overview', 'manager', 'GET', '/api/admin/overview', false],
  ['manager cannot create payouts', 'manager', 'POST', '/api/admin/payouts', false],
  ['manager can answer support requests', 'manager', 'POST', '/api/admin/support/4', true],
  ['accountant can view financial overview', 'accountant', 'GET', '/api/admin/overview', true],
  ['accountant can create a payout instruction', 'accountant', 'POST', '/api/admin/payouts', true],
  ['accountant cannot mark a payout as paid', 'accountant', 'POST', '/api/admin/payouts/12/pay', false],
  ['accountant can request provider verification for a contribution', 'accountant', 'POST', '/api/admin/payments/12/validate', true],
  ['auditor can view the audit log', 'auditor', 'GET', '/api/admin/audit-log', true],
  ['auditor cannot modify payment state', 'auditor', 'POST', '/api/admin/payments/12/validate', false],
  ['auditor cannot view staff accounts', 'auditor', 'GET', '/api/admin/staff', false],
  ['unknown roles are denied', 'unknown', 'GET', '/api/admin/stats', false],
  ['member role is denied from admin API', 'member', 'GET', '/api/admin/stats', false],
  ['invalid IDs do not match manager mutation routes', 'manager', 'POST', '/api/admin/people/0', false],
  ['invalid payout IDs do not match accountant cancellation', 'accountant', 'POST', '/api/admin/payouts/abc/cancel', false]
];

for (const [name, role, method, path, expected] of cases) {
  test(name, () => assert.equal(adminRouteAllowed(role, method, path), expected));
}
