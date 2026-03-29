function normalizePem(value) {
  const normalized = String(value || '')
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  return normalized ? `${normalized}\n` : '';
}

module.exports = {
  saml: {
    entryPoint:
      "https://login.microsoftonline.com/common/saml2",
    issuer: process.env.SAML_ISSUER || "Saml-Demo-App",
    callbackUrl:
      "https://microsoft-entra-demo2.vercel.app/auth/saml/callback",
    cert: normalizePem(
      process.env.SAML_CERT ||
      `-----BEGIN CERTIFICATE-----
MIIC8DCCAdigAwIBAgIQLRBkL6knIaJL/uRngoK1ojANBgkqhkiG9w0BAQsFADA0MTIwMAYDVQQD
EylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGVkIFNTTyBDZXJ0aWZpY2F0ZTAeFw0yNjAzMjkxMzE2
NTlaFw0yOTAzMjkxMzE2NTlaMDQxMjAwBgNVBAMTKU1pY3Jvc29mdCBBenVyZSBGZWRlcmF0ZWQg
U1NPIENlcnRpZmljYXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyvNa/y6svLxk
UI1kCwTjpM2fn0l4XfTC9VhQwuxxnoZS2iLx4yISMxju258uSJlPIqDAQkKwy1js5liKystLdmMd
B+3N3b0hBqJnvqkK4mObq7OjSN8nOWuMJecvELp9ymOet0BujP10nyqa02RNU7sxEs0MjPmppQ11
wn9m3xXbDuH11/wDhor9x4adx9qpUrNav8pnCrxoyyE5ZFTNOsbwlULdP9gmmABH7L9yfz8limax
kHFe38TEX+89ldV23J59bz1jKhctWX4Lumgg9/7TJ1vc8UziIFCz+OjRK9OBIk2HIREGMlDFVIK0
oKCxuud39Qsr/ydGcV6CiklPHQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCOmVITAN7oKoDawSgK
qzBJw/TMneCCjR5WFsyQlLF/WT149mMpmjHEPs/rHqxmw3Soa4hl+NUbHD7RDIEVlSCm98eo0oOE
eLk6hE5nLkXQoCfeAbdCdkHltDg1cLGFaBxhrTrCUesUnf6ppe7Ft1lr39/8tKPRK+weUAj4SqEm
RxDF2JoYPk6zXzzsxBu1yDp4j3DJKkad31NJouCKL95nZc5K0c93DJELP0CdoNn9jPC4tqP8kXP2
/RWcXFZYqM6H6myD4Ay93mWBeTxBMEk9qIBohmzpsRRTp7HOgOdiPOZKLbMm5zXN0lkdD82rCEhr
NDcyu1qdWgZ8vHzFPrOv
-----END CERTIFICATE-----`
    ),
    identifierFormat: null,
    disableRequestedAuthnContext: true,
    users: ["murali80.devops@gmail.com"],
  },
  oidc: {
    discoveryUrl:
      process.env.OIDC_DISCOVERY_URL ||
      "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    clientId: process.env.OIDC_CLIENT_ID || "",
    clientSecret: process.env.OIDC_CLIENT_SECRET || "",
    redirectUri:
      process.env.OIDC_REDIRECT_URI ||
      "http://localhost:3000/auth/oidc/callback",
    postLogoutRedirectUri:
      process.env.OIDC_POST_LOGOUT_REDIRECT_URI ||
      "http://localhost:3000/login",
    scope: process.env.OIDC_SCOPE || "openid profile email",
  },
  ssoRouting: {
    defaultProtocol: process.env.DEFAULT_SSO_PROTOCOL || "",
    domains: {
      // Example:
      // "contoso.com": { protocol: "oidc", domainHint: "contoso.com" },
      // "legacy-partner.com": { protocol: "saml" },
    },
  },

  sessionSecret: process.env.SESSION_SECRET || "your-session-secret",
  port: Number(process.env.PORT || 3000),
};
