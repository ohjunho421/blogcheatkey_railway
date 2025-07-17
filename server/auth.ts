import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import { storage } from './storage';
import type { Express, RequestHandler } from 'express';

// Configure session store
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // 개발 환경에서는 메모리 스토어 사용
  const MemStore = MemoryStore(session);
  const sessionStore = new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'blog-cheat-key-secret-2025',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || false);
  } catch (error) {
    done(error, false);
  }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: '등록되지 않은 이메일입니다.' });
      }

      if (!user.password) {
        return done(null, false, { message: '소셜 로그인 계정입니다. 해당 소셜 로그인을 사용해주세요.' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google Strategy - 개인정보 처리방침 준비 후 활성화 예정
/*
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`
        : "https://022c5bc4-9df7-4d5c-aa3c-6aa3a38babe0-00-2e7jp5xj01nnh.kirk.replit.dev/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with Google ID
        let user = await storage.getUserBySocialId('google', profile.id);
        
        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        if (profile.emails && profile.emails[0]) {
          user = await storage.getUserByEmail(profile.emails[0].value);
          if (user) {
            // Link Google account to existing user
            await storage.updateUser(user.id, {
              googleId: profile.id,
              profileImage: profile.photos?.[0]?.value || user.profileImage
            });
            return done(null, user);
          }
        }

        // Create new user
        const newUser = await storage.createUser({
          email: profile.emails?.[0]?.value || null,
          name: profile.displayName || 'Google User',
          profileImage: profile.photos?.[0]?.value || null,
          googleId: profile.id,
          isEmailVerified: true
        });

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}
*/

// Kakao OAuth Strategy
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/kakao/callback`
      : "https://022c5bc4-9df7-4d5c-aa3c-6aa3a38babe0-00-2e7jp5xj01nnh.kirk.replit.dev/auth/kakao/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Kakao ID
      let user = await storage.getUserBySocialId('kakao', profile.id);
      
      if (user) {
        return done(null, user);
      }

      const email = profile._json?.kakao_account?.email;
      const name = profile.displayName || profile._json?.kakao_account?.profile?.nickname || '카카오 사용자';
      const profileImage = profile._json?.kakao_account?.profile?.profile_image_url;

      // Check if user exists with same email
      if (email) {
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link Kakao account to existing user
          await storage.updateUser(user.id, {
            kakaoId: profile.id,
            profileImage: profileImage || user.profileImage
          });
          return done(null, user);
        }
      }

      // Create new user
      const newUser = await storage.createUser({
        email: email || null,
        name,
        profileImage: profileImage || null,
        kakaoId: profile.id,
        isEmailVerified: !!email
      });

      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));
}

// Naver OAuth Strategy
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/naver/callback`
      : "https://022c5bc4-9df7-4d5c-aa3c-6aa3a38babe0-00-2e7jp5xj01nnh.kirk.replit.dev/auth/naver/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Naver ID
      let user = await storage.getUserBySocialId('naver', profile.id);
      
      if (user) {
        return done(null, user);
      }

      const email = profile.email;
      const name = profile.name || '네이버 사용자';
      const profileImage = profile.profile_image;

      // Check if user exists with same email
      if (email) {
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link Naver account to existing user
          await storage.updateUser(user.id, {
            naverId: profile.id,
            profileImage: profileImage || user.profileImage
          });
          return done(null, user);
        }
      }

      // Create new user
      const newUser = await storage.createUser({
        email: email || null,
        name,
        profileImage: profileImage || null,
        naverId: profile.id,
        isEmailVerified: !!email
      });

      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: '로그인이 필요합니다.' });
};

// Initialize authentication
export function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password utility
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}