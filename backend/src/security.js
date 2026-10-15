import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';

export const hashPassword = (password) => bcrypt.hash(password, 12);
const passwordVersion = (hash) => createHash('sha256').update(hash).digest('hex');

export function createDatabaseAuth(users, secret) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw new Error('A JWT secret of at least 32 bytes is required.');
  const issuer = 'tnpkhr-ip-final';
  const audience = 'tnpkhr-app';
  const dummyHash = bcrypt.hashSync('invalid-login-placeholder', 12);
  return {
    async login(username, password) {
      if (typeof username !== 'string' || !username.trim() || [...username.trim()].length > 50 || typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) return null;
      const user = await users.findByUsername(username.trim());
      // PHP bcrypt $2y$ hashes use the same format as bcrypt $2b$.
      const hash = user?.password_hash?.replace(/^\$2y\$/, '$2b$') ?? dummyHash;
      const valid = await bcrypt.compare(password, hash);
      if (!user || !valid) return null;
      return jwt.sign({ pwv: passwordVersion(user.password_hash) }, secret, { algorithm: 'HS256', subject: String(user.user_id), issuer, audience, expiresIn: '8h' });
    },
    async middleware(req, res, next) {
      const match = /^Bearer (\S+)$/.exec(req.get('Authorization') ?? '');
      let claims;
      try {
        if (!match) throw new Error('Missing token');
        claims = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer, audience });
        if (typeof claims.sub !== 'string' || typeof claims.pwv !== 'string') throw new Error('Invalid claims');
      } catch { return res.status(401).json({ success: false, error: 'Unauthorized. Sign in again.' }); }
      const user = await users.getForAuth(claims.sub);
      if (!user || passwordVersion(user.password_hash) !== claims.pwv) return res.status(401).json({ success: false, error: 'Unauthorized. Sign in again.' });
      req.user = { user_id: user.user_id, username: user.username, role: user.role };
      next();
    },
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Admin access is required.' });
  next();
}
