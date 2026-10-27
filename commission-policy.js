'use strict';

function calculateContributionCommission(amount, isFirstContribution, referrerUserId) {
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('Le montant doit être un entier positif ou nul.');
  }
  const first = Boolean(isFirstContribution);
  const hasReferrer = referrerUserId !== null && referrerUserId !== undefined &&
    Number.isInteger(Number(referrerUserId)) && Number(referrerUserId) > 0;
  const adminFee = first ? Math.round(value * 0.01) : 0;
  const referralFee = first && hasReferrer ? Math.round(value * 0.01) : 0;
  return {
    admin_fee: adminFee,
    referral_fee: referralFee,
    referrer_user_id: first && hasReferrer ? Number(referrerUserId) : null,
    fee: adminFee + referralFee
  };
}

module.exports = { calculateContributionCommission };
