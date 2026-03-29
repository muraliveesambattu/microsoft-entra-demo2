const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const config = require('../config');
const {
  completeAuthorizationCodeFlow,
  createAuthorizationRequest,
  createLogoutUrl,
  isOidcConfigured,
} = require('../lib/oidc');
const {
  findOrCreateSamlUser,
  findOrCreateSsoUser,
  findUserById,
} = require('../store/users');
const router = express.Router();

function loginErrorRedirect(message) {
  return `/login?error=${encodeURIComponent(message)}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getDomainFromEmail(email) {
  const [, domain] = normalizeEmail(email).split('@');
  return domain || '';
}

const configuredSamlUsers = new Set(
  Array.isArray(config.saml?.users)
    ? config.saml.users.map(normalizeEmail).filter(Boolean)
    : []
);

function isConfiguredSamlUser(email) {
  return configuredSamlUsers.has(normalizeEmail(email));
}

function resolveSsoRouting(email) {
  const normalizedEmail = normalizeEmail(email);
  const domain = getDomainFromEmail(normalizedEmail);

  if (!normalizedEmail || !domain) {
    throw new Error('Enter a valid work email address');
  }

  if (isConfiguredSamlUser(normalizedEmail)) {
    return {
      email: normalizedEmail,
      domain,
      protocol: 'saml',
      domainHint: domain,
    };
  }

  const domainRule = config.ssoRouting.domains[domain] || null;
  const protocol = domainRule?.protocol || config.ssoRouting.defaultProtocol || null;

  if (!protocol) {
    throw new Error(`No SSO flow is configured for ${domain}`);
  }

  if (!['saml', 'oidc'].includes(protocol)) {
    throw new Error(`Unsupported SSO protocol configured for ${domain}`);
  }

  if (protocol === 'saml' && configuredSamlUsers.size > 0 && !isConfiguredSamlUser(normalizedEmail)) {
    throw new Error('This email is not allowed to sign in with SAML');
  }

  return {
    email: normalizedEmail,
    domain,
    protocol,
    domainHint: domainRule?.domainHint || domain,
  };
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = findUserById(id);
  done(null, user);
});

passport.use(new SamlStrategy(
  {
    entryPoint: config.saml.entryPoint,
    issuer: config.saml.issuer,
    callbackUrl: config.saml.callbackUrl,
    cert: config.saml.cert,
    identifierFormat: config.saml.identifierFormat,
    disableRequestedAuthnContext: config.saml.disableRequestedAuthnContext,
  },
  (profile, done) => {
    const email = profile['email'] || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || profile.nameID;
    const name = profile['displayName'] || profile['cn'] || profile.nameID;
    if (!email) {
      return done(new Error('No email found in SAML assertion'));
    }

    if (configuredSamlUsers.size > 0 && !isConfiguredSamlUser(email)) {
      return done(new Error('This email is not allowed to sign in with SAML'));
    }

    const user = findOrCreateSamlUser(email, name);
    return done(null, user);
  }
));

router.get('/login', (req, res) => {
  res.render('login', {
    error: req.query.error || null,
    oidcConfigured: isOidcConfigured(config.oidc),
  });
});

router.post('/auth/start', (req, res) => {
  try {
    const routing = resolveSsoRouting(req.body.email);

    req.session.loginContext = {
      email: routing.email,
      domain: routing.domain,
      protocol: routing.protocol,
      domainHint: routing.domainHint,
    };

    if (routing.protocol === 'saml') {
      return res.redirect('/auth/saml/start');
    }

    return res.redirect('/auth/oidc/start');
  } catch (error) {
    return res.redirect(loginErrorRedirect(error.message || 'Unable to start SSO'));
  }
});

router.get('/auth/saml/start', passport.authenticate('saml', { failureRedirect: loginErrorRedirect('SAML login failed') }), (req, res) => {
  // This will redirect to IdP
});

router.post('/auth/saml/start', passport.authenticate('saml', { failureRedirect: loginErrorRedirect('SAML login failed') }), (req, res) => {
  // This will redirect to IdP
});

router.post('/auth/saml/callback',
  passport.authenticate('saml', { failureRedirect: loginErrorRedirect('SAML login failed') }),
  (req, res) => {
    const expectedEmail = normalizeEmail(req.session.loginContext?.email);
    const authenticatedEmail = normalizeEmail(req.user?.email);

    if (expectedEmail && authenticatedEmail && expectedEmail !== authenticatedEmail) {
      req.logout(() => {
        delete req.session.loginContext;
        res.redirect(loginErrorRedirect('Authenticated SAML user does not match the entered email'));
      });
      return;
    }

    // Log SAML response for debugging
    console.log('SAML Response:', req.body.SAMLResponse);
    delete req.session.loginContext;
    res.redirect('/dashboard');
  }
);

router.get('/auth/oidc/start', async (req, res, next) => {
  try {
    const loginContext = req.session.loginContext || null;
    const authorizationUrl = await createAuthorizationRequest({
      session: req.session,
      oidcConfig: config.oidc,
      loginHint: loginContext?.email || null,
      domainHint: loginContext?.domainHint || null,
    });

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('OIDC login start failed:', error);
    res.redirect(loginErrorRedirect(error.message || 'OIDC login failed'));
  }
});

router.get('/auth/oidc/callback', async (req, res, next) => {
  try {
    const { profile } = await completeAuthorizationCodeFlow({
      query: req.query,
      session: req.session,
      oidcConfig: config.oidc,
    });

    const user = findOrCreateSsoUser({
      provider: 'oidc',
      providerUserId: profile.subject,
      email: profile.email,
      name: profile.name,
      username: profile.username,
      claims: profile.claims,
    });

    req.login(user, (error) => {
      if (error) {
        return next(error);
      }

      return res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('OIDC authentication failed:', error);
    res.redirect(loginErrorRedirect(error.message || 'OIDC login failed'));
  } finally {
    delete req.session.loginContext;
  }
});

router.get('/logout', (req, res) => {
  const oidcLogoutPromise = req.user && req.user.provider === 'oidc'
    ? createLogoutUrl(config.oidc)
    : Promise.resolve(null);

  req.logout(() => {
    req.session.destroy(() => {
      oidcLogoutPromise
        .then((logoutUrl) => {
          res.redirect(logoutUrl || '/login');
        })
        .catch((error) => {
          console.error('OIDC logout failed:', error);
          res.redirect('/login');
        });
    });
  });
});

module.exports = router;
