'use strict';

const TOKEN_URL_DEFAULT = 'https://api.orange.com/oauth/v3/token';
const SANDBOX_API_BASE_DEFAULT = 'https://api.orange.com/orange-money-webpay/dev/v1';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

class OrangeMoneyError extends Error {
  constructor(message, code = 'ORANGE_MONEY_ERROR') {
    super(message);
    this.name = 'OrangeMoneyError';
    this.code = code;
  }
}

function getConfig() {
  const mode = String(process.env.ORANGE_MONEY_MODE || 'sandbox').trim().toLowerCase();
  const clientId = String(process.env.ORANGE_MONEY_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.ORANGE_MONEY_CLIENT_SECRET || '').trim();
  const merchantKey = String(process.env.ORANGE_MONEY_MERCHANT_KEY || '').trim();
  const apiBaseUrl = String(
    process.env.ORANGE_MONEY_API_BASE_URL ||
      (mode === 'sandbox' ? SANDBOX_API_BASE_DEFAULT : '')
  ).trim().replace(/\/+$/, '');
  const tokenUrl = String(process.env.ORANGE_MONEY_TOKEN_URL || TOKEN_URL_DEFAULT).trim();
  const currency = String(
    process.env.ORANGE_MONEY_CURRENCY || (mode === 'sandbox' ? 'OUV' : 'XOF')
  ).trim().toUpperCase();

  return { mode, clientId, clientSecret, merchantKey, apiBaseUrl, tokenUrl, currency };
}

function isOrangeMoneyConfigured() {
  const c = getConfig();
  if (!['sandbox', 'production'].includes(c.mode)) return false;
  if (!c.clientId || !c.clientSecret || !c.merchantKey || !c.apiBaseUrl) return false;
  if (c.mode === 'production') {
    return process.env.ORANGE_MONEY_ALLOW_PRODUCTION === '1' &&
      Boolean(process.env.ORANGE_MONEY_API_BASE_URL) &&
      Boolean(process.env.ORANGE_MONEY_CURRENCY);
  }
  return true;
}

function safeHttpsUrl(value, label) {
  let u;
  try {
    u = new URL(value);
  } catch (_) {
    throw new OrangeMoneyError(label + ' est invalide.', 'ORANGE_MONEY_CONFIG');
  }
  if (u.protocol !== 'https:') {
    throw new OrangeMoneyError(label + ' doit utiliser HTTPS.', 'ORANGE_MONEY_CONFIG');
  }
  return u.toString();
}

async function readJsonResponse(response, label) {
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {
    throw new OrangeMoneyError(label + ' a renvoyé une réponse illisible.', 'ORANGE_MONEY_BAD_RESPONSE');
  }
  if (!response.ok) {
    const detail = data && data.error_description ? String(data.error_description) : '';
    const suffix = detail ? ' (' + detail.slice(0, 180) + ')' : '';
    throw new OrangeMoneyError(label + ' a refusé la demande (HTTP ' + response.status + ')' + suffix, 'ORANGE_MONEY_UPSTREAM');
  }
  return data;
}

async function getAccessToken() {
  const c = getConfig();
  if (!isOrangeMoneyConfigured()) {
    throw new OrangeMoneyError(
      'Orange Money n’est pas encore configuré. Il faut les identifiants officiels de test du portail Orange Developer et la clé marchand. Aucun paiement n’a été lancé.',
      'ORANGE_MONEY_NOT_CONFIGURED'
    );
  }

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) return cachedToken;

  const tokenUrl = safeHttpsUrl(c.tokenUrl, 'L’URL du jeton Orange Money');
  const auth = Buffer.from(c.clientId + ':' + c.clientSecret).toString('base64');
  let response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15000)
    });
  } catch (_) {
    throw new OrangeMoneyError('Impossible de joindre le service d’authentification Orange Money. Réessayez plus tard.', 'ORANGE_MONEY_NETWORK');
  }

  const data = await readJsonResponse(response, 'L’authentification Orange Money');
  if (!data.access_token) {
    throw new OrangeMoneyError('Orange Money n’a pas fourni de jeton d’accès.', 'ORANGE_MONEY_BAD_RESPONSE');
  }
  const expiresIn = Math.max(60, Number(data.expires_in) || 300);
  cachedToken = String(data.access_token);
  cachedTokenExpiresAt = Date.now() + Math.max(30, expiresIn - 60) * 1000;
  return cachedToken;
}

function getApiBase() {
  const c = getConfig();
  const apiBase = safeHttpsUrl(c.apiBaseUrl, 'L’URL API Orange Money').replace(/\/+$/, '');
  if (c.mode === 'sandbox') {
    const u = new URL(apiBase);
    if (u.hostname !== 'api.orange.com' || !u.pathname.includes('/dev/')) {
      throw new OrangeMoneyError(
        'Le mode sandbox doit utiliser l’API de test Orange Money. Aucune transaction réelle ne sera lancée.',
        'ORANGE_MONEY_SANDBOX_URL'
      );
    }
  }
  return apiBase;
}

async function orangeRequest(path, body, label) {
  const token = await getAccessToken();
  const url = getApiBase() + '/' + String(path).replace(/^\/+/, '');
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
  } catch (_) {
    throw new OrangeMoneyError('Connexion au service Orange Money interrompue. Le statut reste à vérifier.', 'ORANGE_MONEY_NETWORK');
  }
  return readJsonResponse(response, label);
}

async function createOrangePayment({ orderId, amount, returnUrl, cancelUrl, notifUrl }) {
  const c = getConfig();
  if (!Number.isInteger(Number(amount)) || Number(amount) < 1) {
    throw new OrangeMoneyError('Le montant envoyé à Orange Money est invalide.', 'ORANGE_MONEY_AMOUNT');
  }
  const body = {
    merchant_key: c.merchantKey,
    currency: c.currency,
    order_id: String(orderId),
    amount: Number(amount),
    return_url: safeHttpsUrl(returnUrl, 'L’URL de retour'),
    cancel_url: safeHttpsUrl(cancelUrl, 'L’URL d’annulation'),
    notif_url: safeHttpsUrl(notifUrl, 'L’URL de notification'),
    lang: 'fr'
  };
  const data = await orangeRequest('webpayment', body, 'La création du paiement Orange Money');
  const paymentUrl = String(data.payment_url || data.paymentUrl || '').trim();
  const payToken = String(data.pay_token || data.payToken || '').trim();
  const notifToken = String(data.notif_token || data.notifToken || '').trim();

  if (!paymentUrl || !payToken) {
    throw new OrangeMoneyError(
      'Orange Money n’a pas renvoyé les informations nécessaires au paiement. La cotisation n’a pas été lancée.',
      'ORANGE_MONEY_BAD_RESPONSE'
    );
  }
  const safePaymentUrl = safeHttpsUrl(paymentUrl, 'Le lien de paiement Orange Money');
  return {
    paymentUrl: safePaymentUrl,
    payToken,
    notifToken,
    providerStatus: String(data.status || 'created')
  };
}

async function checkOrangePayment({ orderId, amount, payToken }) {
  if (!orderId || !payToken) {
    throw new OrangeMoneyError('Les références nécessaires pour vérifier le paiement sont absentes.', 'ORANGE_MONEY_REFERENCE_MISSING');
  }
  return orangeRequest('transactionstatus', {
    order_id: String(orderId),
    amount: Number(amount),
    pay_token: String(payToken)
  }, 'La vérification du paiement Orange Money');
}

function classifyOrangeStatus(data) {
  const raw = data && (
    data.status ??
    data.transaction_status ??
    data.payment_status ??
    data.result
  );
  const value = String(raw == null ? '' : raw).trim().toUpperCase();
  if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED'].includes(value)) {
    return { status: 'validated', providerStatus: value };
  }
  if (['FAILED', 'FAILURE', 'EXPIRED', 'CANCELLED', 'CANCELED', 'REJECTED'].includes(value)) {
    return { status: 'refused', providerStatus: value };
  }
  return { status: 'pending', providerStatus: value || 'PENDING' };
}

module.exports = {
  isOrangeMoneyConfigured,
  createOrangePayment,
  checkOrangePayment,
  classifyOrangeStatus
};
