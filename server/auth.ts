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
    const email = profile.emails?.[0]?.value || '';
    
    // 1. googleId로 사용자 찾기
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (!user && email) {
      // 2. 이메일로 기존 사용자 찾기
      user = await storage.getUserByEmail(email);
      
      if (user) {
        // 기존 이메일 계정에 googleId 연결
        await storage.updateUser(user.id, { googleId: profile.id });
        console.log(`Google ID linked to existing user: ${email}`);
      }
    }
    
    if (!user) {
      // 3. 새 사용자 생성
      user = await storage.createUser({
        googleId: profile.id,
        email,
        name: profile.displayName || '',
        profileImage: profile.photos?.[0]?.value || '',
        isEmailVerified: true,
        subscriptionTier: 'basic',
        canGenerateContent: true,
        canGenerateImages: false,
        canUseChatbot: false,
      });
      console.log(`New Google user created: ${email}`);
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
}));

// Kakao OAuth Strategy (환경 변수가 있을 때만 활성화)
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    callbackURL: "/api/auth/kakao/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile._json?.kakao_account?.email || '';
      
      // 1. kakaoId로 사용자 찾기
      let user = await storage.getUserByKakaoId(profile.id);
      
      if (!user && email) {
        // 2. 이메일로 기존 사용자 찾기
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // 기존 이메일 계정에 kakaoId 연결
          await storage.updateUser(user.id, { kakaoId: profile.id });
          console.log(`Kakao ID linked to existing user: ${email}`);
        }
      }
      
      if (!user) {
        // 3. 새 사용자 생성
        user = await storage.createUser({
          kakaoId: profile.id,
          email,
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
  console.log('✅ Kakao OAuth enabled');
} else {
  console.log('⚠️ Kakao OAuth disabled - missing credentials');
}

// Naver OAuth Strategy (환경 변수가 있을 때만 활성화)
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: "/api/auth/naver/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.email || '';
      
      // 1. naverId로 사용자 찾기
      let user = await storage.getUserByNaverId(profile.id);
      
      if (!user && email) {
        // 2. 이메일로 기존 사용자 찾기
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // 기존 이메일 계정에 naverId 연결
          await storage.updateUser(user.id, { naverId: profile.id });
          console.log(`Naver ID linked to existing user: ${email}`);
        }
      }
      
      if (!user) {
        // 3. 새 사용자 생성
        user = await storage.createUser({
          naverId: profile.id,
          email,
          name: profile.name || profile.nickname || '',
          profileImage: profile.profile_image || '',
          isEmailVerified: true,
          subscriptionTier: 'basic',
          canGenerateContent: true,
          canGenerateImages: false,
          canUseChatbot: false,
        });
        console.log(`New Naver user created: ${email}`);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, undefined);
    }
  }));
  console.log('✅ Naver OAuth enabled');
} else {
  console.log('⚠️ Naver OAuth disabled - missing credentials');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      console.log(`User not found for session ID: ${id}`);
      return done(null, false); // 사용자 없으면 false 반환 (오류 아님)
    }
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(null, false); // 오류 발생 시 false 반환 (세션 무효화)
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
        
        // 세션 저장 완료 후 리다이렉트
        req.session.save((err) => {
          if (err) {
            console.error('Google session save error:', err);
            return res.redirect('/?error=session');
          }
          console.log('Google session saved, redirecting...');
          
          // localStorage 정리 후 리다이렉트
          res.send(`
            <html>
              <script>
                localStorage.removeItem('auth_logged_out');
                localStorage.removeItem('auth_has_error');
                window.location.href = '/';
              </script>
            </html>
          `);
        });
      } else {
        res.redirect('/');
      }
    }
  );

  // Kakao OAuth routes (환경 변수가 있을 때만 활성화)
  if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
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
          
          // 세션 저장 완료 후 리다이렉트
          req.session.save((err) => {
            if (err) {
              console.error('Kakao session save error:', err);
              return res.redirect('/?error=session');
            }
            console.log('Kakao session saved, redirecting...');
            
            // localStorage 정리 후 리다이렉트
            res.send(`
              <html>
                <script>
                  localStorage.removeItem('auth_logged_out');
                  window.location.href = '/';
                </script>
              </html>
            `);
          });
        } else {
          res.redirect('/');
        }
      }
    );
  }

  // Naver OAuth routes (환경 변수가 있을 때만 활성화)
  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
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
          
          // 세션 저장 완료 후 리다이렉트
          req.session.save((err) => {
            if (err) {
              console.error('Naver session save error:', err);
              return res.redirect('/?error=session');
            }
            console.log('Naver session saved, redirecting...');
            
            // localStorage 정리 후 리다이렉트
            res.send(`
              <html>
                <script>
                  localStorage.removeItem('auth_logged_out');
                  window.location.href = '/';
                </script>
              </html>
            `);
          });
        } else {
          res.redirect('/');
        }
      }
    );
  }

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