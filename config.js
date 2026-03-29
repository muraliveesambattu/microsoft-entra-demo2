module.exports = {
  saml: {
    entryPoint:
      process.env.SAML_ENTRY_POINT ||
      "https://login.microsoftonline.com/common/saml2",
    issuer: process.env.SAML_ISSUER || "Saml-Test-App",
    callbackUrl:
      process.env.SAML_CALLBACK_URL ||
      "https://microsoft-entra-demo2.vercel.app/auth/saml/callback",
    cert:
      process.env.SAML_CERT ||
      `-----BEGIN CERTIFICATE-----
            MIIC8DCCAdigAwIBAgIQLArc30yy7bJFNbuqxZZm/DANBgkqhkiG9w0BAQsFADA0MTIwMAYDVQQD
            EylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGVkIFNTTyBDZXJ0aWZpY2F0ZTAeFw0yNjAzMjcwNTMz
            MzFaFw0yOTAzMjcwNTMzMzVaMDQxMjAwBgNVBAMTKU1pY3Jvc29mdCBBenVyZSBGZWRlcmF0ZWQg
            U1NPIENlcnRpZmljYXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8p6b37f/ST8U
            ZdjqkM8EDDGu8bHwxlnjitIB8f22BfFkyrh4LUm5PsN/tBfxj8GYWCwThS8WtgTnbK2gZtA71PKe
            IC3AO5g+8u07Xo7q0JljzBwzq/dPOT+UK/qe2sPPHtBj6r0wG/5IHwtfOBpmsrKalIW6JH2wx/5z
            REcxrbX3SQDSCHjXSp/VnshYXIDaPlypuxw5FqWlKmeQgGu63KAXRka6MUKmy2X28mk9Nvw9jotP
            Xu70Ud8iljM/wmFxisvTWaGxX5bRxaTXo+uHE7Po+i96j0MSw9RI/QVFVw7iPidGwlVI4IHwtWkc
            iQpxLH1e94yOEFvShIC+r4f4vQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQA1jEMwDKj2AcK9jlPQ
            TMes+MKgj6VOok9VTOKSy5DbWwOCKenB7140IvdK2gHlt4DE7hfNofy8lWvbiuPghSmPUq5rvjLd
            6Z06zMOQGDC2sFv2l3p910EhtV/ETVORSc48B2ujw8RYkcGuUlt1HJeK4lK9YJs12TqW9eLbivuc
            6+nMlkQHCodxu233hKr6QeT62+/eP1yMWg/dOA8iAcYMxcLDqvqEnsBmOSLQH9ShWcyUQSbInB/O
            4CskxBRlDihX6XtMd9mmIiEqdmA1Nw9+FMrM9fd2QAns9PmPKahmTwaYrINpuT5HIgzJL+GoD+uT
            xe5E5rIfiqDo9HZUy6US
            -----END CERTIFICATE-----
            `,
    identifierFormat: null,
    disableRequestedAuthnContext: true,
    users: ["murali.v@labtech24.in"],
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
