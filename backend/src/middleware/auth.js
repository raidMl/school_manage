const HttpError = require('../utils/httpError');
const { verifyAuthToken } = require('../utils/jwt');

function getTokenFromRequest(req) {
  const authorization = req.headers.authorization || '';

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7);
  }

  return null;
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new HttpError(401, 'Authentication required');
    }

    req.auth = verifyAuthToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAuth;