export const MOCK_TOKEN = 'mock-jwt-token';

// Examination/development authentication only. This is not a signed JWT.
export function requireAuth(req, res, next) {
  if (req.get('Authorization') !== `Bearer ${MOCK_TOKEN}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Sign in with a valid bearer token.' });
  }
  next();
}
