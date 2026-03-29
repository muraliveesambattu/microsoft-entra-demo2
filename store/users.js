// Simple in-memory user store
const usersById = {};
const usersByProviderKey = {};

function findUserById(id) {
  return usersById[id] || null;
}

function findOrCreateSsoUser({ provider, providerUserId, email, name, username, claims }) {
  const stableIdentifier = providerUserId || email || username;

  if (!stableIdentifier) {
    throw new Error('A stable user identifier is required');
  }

  const lookupKey = `${provider}:${stableIdentifier}`;

  if (!usersByProviderKey[lookupKey]) {
    usersByProviderKey[lookupKey] = {
      id: lookupKey,
      provider,
      providerUserId: providerUserId || null,
      email: email || null,
      username: username || email || null,
      name: name || email || username || providerUserId || 'User',
      claims: claims || null,
    };
    usersById[lookupKey] = usersByProviderKey[lookupKey];
  } else {
    usersByProviderKey[lookupKey] = {
      ...usersByProviderKey[lookupKey],
      email: email || usersByProviderKey[lookupKey].email,
      username: username || usersByProviderKey[lookupKey].username,
      name: name || usersByProviderKey[lookupKey].name,
      claims: claims || usersByProviderKey[lookupKey].claims,
    };
    usersById[lookupKey] = usersByProviderKey[lookupKey];
  }

  return usersByProviderKey[lookupKey];
}

function findOrCreateSamlUser(email, name) {
  return findOrCreateSsoUser({
    provider: 'saml',
    providerUserId: email,
    email,
    name,
  });
}

module.exports = {
  findOrCreateSamlUser,
  findOrCreateSsoUser,
  findUserById,
};
