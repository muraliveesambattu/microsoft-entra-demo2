module.exports = {
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT || "https://login.microsoftonline.com/common/saml2",
    issuer: process.env.SAML_ISSUER || "urn:nodejs-saml-app2",
    callbackUrl: process.env.SAML_CALLBACK_URL || "http://localhost:3000/auth/saml/callback",
    cert: process.env.SAML_CERT || `-----BEGIN CERTIFICATE-----
            MIIC8DCCAdigAwIBAgIQZ5Iw1NnbortJRaDAfG4uRTANBgkqhkiG9w0BAQsFADA0MTIwMAYDVQQD
            EylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGVkIFNTTyBDZXJ0aWZpY2F0ZTAeFw0yNjAzMjcxMjQ0
            MTNaFw0yOTAzMjcxMjQ0MTNaMDQxMjAwBgNVBAMTKU1pY3Jvc29mdCBBenVyZSBGZWRlcmF0ZWQg
            U1NPIENlcnRpZmljYXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5vtW+R4HE5fg
            +hrMjMo0SHkqoc/3VFTRh/IEBBIXRuAm2Oj+djMbaOlpC9U7szfZ3jG3sF/RxqkQlRyNtQZ/QwLr
            TlY8fuh+tDGvoC4GLHRAY1gwnwtLRR4heKxgsAoptZG8b8lslZTAasuGQR6qnKLeHw6F9Q3lUw6+
            KjawSMy3txy85G3fbGoun38N/1Dyo0AfSd2Bc3y0oH7ASK/U2deX1pkxW7MPK89VnZ4aZu7/mayr
            OrAmaXSg6IHVDD6yf5byZhjqFm5aQ11dxscCX9s7BFq98dFIhae9uCxlFDMpbh9tSgeUDV1MeVeW
            IMoYmbfm4kFmzRUwlEsg2Sz8AQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBiXBJRkC64j9rvX6rN
            uslvQTTPdKGGmQGyaBcngyniiTYHNnqJK/c/gAahmd5GObDWLA09cDavpqJyiP+7sFW/eYv2yWe0
            biSv361W5nIkp9KLD2LEUXdWpocD0Me9ODLchc0YnrfjpOmUCGum9lg0olGlyVqF1COSp8m8RulP
            nAlVTwCDbv3CNOzMM7fjzlHoCN+jrCz0ywZbPZ1144nx41JmPqEFui9lrvGl6hR+o1e07/6TOkIL
            EUB28vbun7mWKsdQLmHb1LxiHb/FG0yIc/rm1ZqEmeRfHs89hy7mlZVjzKOnk2j+E1+GGh4ZYkpl
            5mHZSK+bIAvxSRQ5fTPf
            -----END CERTIFICATE-----
            `,
    identifierFormat: null,
    disableRequestedAuthnContext: true,
    users: [
      "murali.v1@murali80devopsgmail.onmicrosoft.com"
    ],
  },
  oidc: {
    discoveryUrl: process.env.OIDC_DISCOVERY_URL || "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    clientId: process.env.OIDC_CLIENT_ID || "",
    clientSecret: process.env.OIDC_CLIENT_SECRET || "",
    redirectUri: process.env.OIDC_REDIRECT_URI || "http://localhost:3000/auth/oidc/callback",
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI || "http://localhost:3000/login",
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