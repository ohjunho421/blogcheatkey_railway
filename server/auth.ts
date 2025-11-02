import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import type { Express } from 'express';

const pgStore = connectPg(session);

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (!user) {
      // Create new user with Google OAuth
      user = await storage.createUser({
        googleId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        profileImage: profile.photos?.[0]?.value || '',
        isEmailVerified: true,
        subscriptionTier: 'basic',
        canGenerateContent: true,
        canGenerateImages: false,
        canUseChatbot: false,
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
}));

// Kakao OAuth Strategy
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID!,
  clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  callbackURL: "/api/auth/kakao/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user exists
    let user = await storage.getUserByKakaoId(profile.id);
    
    if (!user) {
      // Create new user with Kakao OAuth
      user = await storage.createUser({
        kakaoId: profile.id,
        email: profile._json?.kakao_account?.email || '',
        name: profile.displayName || profile.username || '',
        profileImage: profile._json?.properties?.profile_image || '',
        isEmailVerified: profile._json?.kakao_account?.is_email_verified || false,
        subscriptionTier: 'basic',
        canGenerateContent: true,
        canGenerateImages: false,
        canUseChatbot: false,
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
}));

// Naver OAuth Strategy
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  callbackURL: "/api/auth/naver/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user exists
    let user = await storage.getUserByNaverId(profile.id);
    
    if (!user) {
      // Create new user with Naver OAuth
      user = await storage.createUser({
        naverId: profile.id,
        email: profile.email || '',
        name: profile.name || profile.nickname || '',
        profileImage: profile.profile_image || '',
        isEmailVerified: true,
        subscriptionTier: 'basic',
        canGenerateContent: true,
        canGenerateImages: false,
        canUseChatbot: false,
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export function setupAuth(app: Express) {
  // Trust proxy for cookie settings
  app.set('trust proxy', 1);
  
  // Session configuration
  const isProduction = process.env.NODE_ENV === 'production';
  
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
      secure: isProduction, // HTTPS에서는 true
      httpOnly: true, // XSS 공격 방지
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? 'none' : 'lax', // Cross-site 쿠키 허용
      domain: undefined
    },
    proxy: isProduction // Railway의 프록시 신뢰
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // 성공시 세션에 사용자 ID 저장
      if (req.user) {
        (req.session as any).userId = (req.user as any).id;
        console.log('Google login successful, user ID:', (req.user as any).id);
      }
      res.redirect('/');
    }
  );

  // Kakao OAuth routes
  app.get('/api/auth/kakao', 
    passport.authenticate('kakao')
  );

  app.get('/api/auth/kakao/callback',
    passport.authenticate('kakao', { failureRedirect: '/' }),
    (req, res) => {
      // 성공시 세션에 사용자 ID 저장
      if (req.user) {
        (req.session as any).userId = (req.user as any).id;
        console.log('Kakao login successful, user ID:', (req.user as any).id);
      }
      res.redirect('/');
    }
  );

  // Naver OAuth routes
  app.get('/api/auth/naver', 
    passport.authenticate('naver')
  );

  app.get('/api/auth/naver/callback',
    passport.authenticate('naver', { failureRedirect: '/' }),
    (req, res) => {
      // 성공시 세션에 사용자 ID 저장
      if (req.user) {
        (req.session as any).userId = (req.user as any).id;
        console.log('Naver login successful, user ID:', (req.user as any).id);
      }
      res.redirect('/');
    }
  );

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Middleware to protect routes
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}