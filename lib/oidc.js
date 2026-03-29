const crypto = require('crypto');

const metadataCache = new Map();
const jwksCache = new Map();

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function randomToken(size = 32) {
  return base64UrlEncode(crypto.randomBytes(size));
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OIDC request failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function getMetadata(discoveryUrl) {
  if (!metadataCache.has(discoveryUrl)) {
    metadataCache.set(discoveryUrl, fetchJson(discoveryUrl));
  }

  return metadataCache.get(discoveryUrl);
}

async function getJwks(jwksUri) {
  if (!jwksCache.has(jwksUri)) {
    jwksCache.set(jwksUri, fetchJson(jwksUri));
  }

  return jwksCache.get(jwksUri);
}

function decodeJwt(token) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid ID token format');
  }

  return {
    encodedHeader,
    encodedPayload,
    signature,
    header: JSON.parse(base64UrlDecode(encodedHeader).toString('utf8')),
    payload: JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')),
  };
}

function verifyJwtSignature(token, jwk) {
  const { encodedHeader, encodedPayload, signature } = decodeJwt(token);
  const verifier = crypto.createVerify('RSA-SHA256');

  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  return verifier.verify(
    crypto.createPublicKey({ key: jwk, format: 'jwk' }),
    base64UrlDecode(signature)
  );
}

function audienceMatches(aud, clientId) {
  if (Array.isArray(aud)) {
    return aud.includes(clientId);
  }

  return aud === clientId;
}

function issuerMatches(expectedIssuer, actualIssuer, claims) {
  if (expectedIssuer === actualIssuer) {
    return true;
  }

  if (expectedIssuer.includes('{tenantid}') && claims.tid) {
    return expectedIssuer.replace('{tenantid}', claims.tid) === actualIssuer;
  }

  return false;
}

async function validateIdToken({ idToken, metadata, clientId, nonce }) {
  const decoded = decodeJwt(idToken);
  const { header, payload } = decoded;

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported ID token algorithm: ${header.alg}`);
  }

  const jwks = await getJwks(metadata.jwks_uri);
  const signingKey = jwks.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');

  if (!signingKey) {
    throw new Error('Unable to find a matching OIDC signing key');
  }

  if (!verifyJwtSignature(idToken, signingKey)) {
    throw new Error('ID token signature validation failed');
  }

  const now = Math.floor(Date.now() / 1000);

  if (!audienceMatches(payload.aud, clientId)) {
    throw new Error('ID token audience mismatch');
  }

  if (!issuerMatches(metadata.issuer, payload.iss, payload)) {
    throw new Error('ID token issuer mismatch');
  }

  if (payload.exp <= now - 60) {
    throw new Error('ID token has expired');
  }

  if (payload.nbf && payload.nbf > now + 60) {
    throw new Error('ID token is not valid yet');
  }

  if (nonce && payload.nonce !== nonce) {
    throw new Error('ID token nonce mismatch');
  }

  return payload;
}

function buildAuthorizationUrl({ metadata, oidcConfig, state, nonce, codeChallenge, loginHint, domainHint }) {
  const url = new URL(metadata.authorization_endpoint);

  url.searchParams.set('client_id', oidcConfig.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', oidcConfig.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', oidcConfig.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (loginHint) {
    url.searchParams.set('login_hint', loginHint);
  }
  if (domainHint) {
    url.searchParams.set('domain_hint', domainHint);
  }

  return url.toString();
}

async function exchangeCodeForTokens({ metadata, oidcConfig, code, codeVerifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: oidcConfig.redirectUri,
    client_id: oidcConfig.clientId,
    client_secret: oidcConfig.clientSecret,
    code_verifier: codeVerifier,
  });

  return fetchJson(metadata.token_endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}

function mapClaimsToProfile(claims) {
  const email = claims.email || claims.preferred_username || claims.upn || null;
  const username = claims.preferred_username || claims.upn || email;
  const name = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || username || claims.sub;

  return {
    subject: claims.sub || claims.oid || username,
    email,
    username,
    name,
    claims,
  };
}

function isOidcConfigured(oidcConfig) {
  return Boolean(
    oidcConfig &&
    oidcConfig.discoveryUrl &&
    oidcConfig.clientId &&
    oidcConfig.clientSecret &&
    oidcConfig.redirectUri
  );
}

async function createAuthorizationRequest({ session, oidcConfig, loginHint, domainHint }) {
  if (!isOidcConfigured(oidcConfig)) {
    throw new Error('OIDC is not configured');
  }

  const metadata = await getMetadata(oidcConfig.discoveryUrl);
  const state = randomToken(24);
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

  session.oidc = {
    state,
    nonce,
    codeVerifier,
  };

  return buildAuthorizationUrl({
    metadata,
    oidcConfig,
    state,
    nonce,
    codeChallenge,
    loginHint,
    domainHint,
  });
}

async function completeAuthorizationCodeFlow({ query, session, oidcConfig }) {
  if (!isOidcConfigured(oidcConfig)) {
    throw new Error('OIDC is not configured');
  }

  if (query.error) {
    throw new Error(query.error_description || query.error);
  }

  if (!query.code || !query.state) {
    throw new Error('Missing OIDC authorization response parameters');
  }

  if (!session.oidc) {
    throw new Error('OIDC session state was not found');
  }

  if (session.oidc.state !== query.state) {
    throw new Error('OIDC state validation failed');
  }

  const metadata = await getMetadata(oidcConfig.discoveryUrl);
  const tokenSet = await exchangeCodeForTokens({
    metadata,
    oidcConfig,
    code: query.code,
    codeVerifier: session.oidc.codeVerifier,
  });

  if (!tokenSet.id_token) {
    throw new Error('OIDC provider did not return an ID token');
  }

  const claims = await validateIdToken({
    idToken: tokenSet.id_token,
    metadata,
    clientId: oidcConfig.clientId,
    nonce: session.oidc.nonce,
  });

  delete session.oidc;

  return {
    tokenSet,
    claims,
    profile: mapClaimsToProfile(claims),
  };
}

async function createLogoutUrl(oidcConfig) {
  if (!isOidcConfigured(oidcConfig)) {
    return null;
  }

  const metadata = await getMetadata(oidcConfig.discoveryUrl);

  if (!metadata.end_session_endpoint) {
    return oidcConfig.postLogoutRedirectUri || null;
  }

  const url = new URL(metadata.end_session_endpoint);

  if (oidcConfig.postLogoutRedirectUri) {
    url.searchParams.set('post_logout_redirect_uri', oidcConfig.postLogoutRedirectUri);
  }

  if (oidcConfig.clientId) {
    url.searchParams.set('client_id', oidcConfig.clientId);
  }

  return url.toString();
}

module.exports = {
  completeAuthorizationCodeFlow,
  createAuthorizationRequest,
  createLogoutUrl,
  isOidcConfigured,
};
