'use strict';

/**
 * Server-side access policy for the NAFA FINANCE administration API.
 * The caller must authenticate the identity against PostgreSQL before calling
 * this policy. UI navigation filtering is for usability only; this is the
 * authoritative access check.
 */
function adminRouteAllowed(role, method, path) {
  if (role === 'admin') return true;

  const p = path.startsWith('/api/admin') ? path.slice(10) || '/' : path;
  const m = String(method || 'GET').toUpperCase();
  const segments = p.split('/').filter(Boolean);
  const numericId = value =>
    value !== undefined && value !== '' &&
    Number.isInteger(Number(value)) && Number(value) > 0;

  if (role === 'manager') {
    if (m === 'GET' && [
      '/stats', '/members', '/dashboard', '/people', '/groups',
      '/notifications', '/messages', '/support', '/member-documents'
    ].includes(p)) return true;
    if (m === 'GET' && segments.length === 3 &&
        segments[0] === 'member-documents' && numericId(segments[1]) &&
        segments[2] === 'content') return true;
    if (m === 'POST' && segments.length === 2 &&
        segments[0] === 'people' && numericId(segments[1])) return true;
    if (m === 'POST' && ['/groups', '/messages'].includes(p)) return true;
    if (m === 'DELETE' && segments.length === 2 &&
        segments[0] === 'groups' && numericId(segments[1])) return true;
    if (m === 'POST' && segments.length === 2 &&
        segments[0] === 'support' && numericId(segments[1])) return true;
    if (m === 'POST' && segments.length === 3 &&
        segments[0] === 'member-documents' && numericId(segments[1]) &&
        ['validate', 'refuse'].includes(segments[2])) return true;
    return false;
  }

  if (role === 'accountant') {
    if (m === 'GET' && [
      '/stats', '/dashboard', '/members', '/people', '/payments', '/pay',
      '/overview', '/journal', '/powerbi/export.csv', '/payouts',
      '/commissions', '/referral-commissions', '/crosstab', '/groups', '/notifications'
    ].includes(p)) return true;
    if (m === 'GET' && segments.length === 2 &&
        segments[0] === 'pay' && numericId(segments[1])) return true;
    if (m === 'POST' && segments.length === 3 &&
        segments[0] === 'payments' && numericId(segments[1]) &&
        ['validate', 'refuse'].includes(segments[2])) return true;
    if (m === 'POST' && p === '/payouts') return true;
    if (m === 'POST' && segments.length === 3 &&
        segments[0] === 'payouts' && numericId(segments[1]) &&
        segments[2] === 'cancel') return true;
    return false;
  }

  if (role === 'auditor') {
    return m === 'GET' && (
      [
        '/stats', '/dashboard', '/payments', '/pay', '/overview', '/journal',
        '/powerbi/export.csv', '/commissions', '/referral-commissions', '/crosstab', '/groups', '/audit-log'
      ].includes(p) ||
      (segments.length === 2 && segments[0] === 'pay' && numericId(segments[1]))
    );
  }

  return false;
}

module.exports = { adminRouteAllowed };
