'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateContributionCommission } = require('../commission-policy');

test('first contribution allocates 1% to admin when there is no referrer', () => {
  assert.deepEqual(calculateContributionCommission(500, true, null), {
    admin_fee: 5, referral_fee: 0, referrer_user_id: null, fee: 5
  });
});

test('first contribution allocates 1% to admin and 1% to valid referrer', () => {
  assert.deepEqual(calculateContributionCommission(500, true, 23), {
    admin_fee: 5, referral_fee: 5, referrer_user_id: 23, fee: 10
  });
});

test('later contributions have no commissions even if a referrer exists', () => {
  assert.deepEqual(calculateContributionCommission(500, false, 23), {
    admin_fee: 0, referral_fee: 0, referrer_user_id: null, fee: 0
  });
});

test('invalid amounts are rejected', () => {
  assert.throws(() => calculateContributionCommission(-1, true, null), TypeError);
  assert.throws(() => calculateContributionCommission(1.5, true, null), TypeError);
});
