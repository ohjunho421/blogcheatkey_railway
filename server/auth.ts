import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express } from 'express';

const pgStore = connectPg(session);

export function setupAuth(app: Express) {
  // Trust proxy for cookie settings
  app.set('trust proxy', 1);
  
  // Session configuration
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      secure: false,
      httpOnly: false, // 개발용
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      domain: undefined
    }
  }));
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (userId) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}