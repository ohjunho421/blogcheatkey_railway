import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { businessInfoSchema, keywordAnalysisSchema, seoMetricsSchema, updateUserPermissionsSchema } from "@shared/schema";
import { analyzeKeyword, editContent, enhanceIntroductionAndConclusion } from "./services/gemini";
import { preparePayment, verifyPayment, cancelPayment, getPaymentHistory } from "./services/portone";
import { setupAuth, requireAuth } from './auth';
import { writeOptimizedBlogPost } from "./services/anthropic";
import { searchResearch, getDetailedResearch } from "./services/perplexity";
import { analyzeSEOOptimization } from "./services/seoOptimizer";
import { enhancedSEOAnalysis } from "./services/morphemeAnalyzer";
import { TitleGenerator } from "./services/titleGenerator";
import { formatForMobile } from "./services/mobileFormatter";
import { formatForMobileSmartBatch } from "./services/smartMobileFormatter";
import { setupAdminRoutes } from "./admin-routes";
import paymentRoutes from "./payment-routes";
import bcrypt from "bcryptjs";

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(req: any): Promise<number | null> {
  // 실제 로그인한 사용자 ID 획득
  let userId = (req.session as any)?.userId;
  
  // Authorization 헤더에서 세션 ID로 사용자 찾기
  if (!userId && req.headers.authorization) {
    const sessionId = req.headers.authorization.includes('Bearer') ? 
      req.headers.authorization.replace('Bearer ', '') : null;
    
    if (sessionId) {
      try {
        // 세션 스토어에서 해당 세션 ID로 실제 사용자 찾기
        const sessionStore = req.sessionStore;
        await new Promise<void>((resolve) => {
          sessionStore.get(sessionId, (err: any, session: any) => {
            if (!err && session && session.userId) {
              console.log("Found user from session:", session.userId);
              userId = session.userId;
            }
            resolve();
          });
        });
      } catch (error) {
        console.error("Session lookup error:", error);
      }
    }
  }
  
  return userId || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication middleware
  setupAuth(app);
  
  // Setup admin routes
  setupAdminRoutes(app, storage);

  // Setup payment routes
  app.use('/api/payments', paymentRoutes);

  // Google Search Console verification route
  app.get('/google*.html', (req, res) => {
    const filename = req.path.substring(1); // Remove leading slash
    res.send(`google-site-verification: ${filename}`);
  });

  // ===== AUTHENTICATION ROUTES =====
  
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요" });
      }

      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "이메일 또는 비밀번호가 잘못되었습니다" });
      }

      // 기존 passport 세션 정리 (다른 사용자로 로그인된 경우 충돌 방지)
      if ((req.session as any).passport) {
        delete (req.session as any).passport;
        console.log("Cleared existing passport session");
      }
      
      // 세션에 사용자 정보 저장
      (req.session as any).userId = user.id;
      console.log("Session set:", req.session);
      console.log("Session ID:", req.sessionID);
      
      // 세션 저장 강제 실행 및 응답
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "세션 저장 오류" });
        } else {
          console.log("Session saved successfully");
          // 세션 ID를 응답에 포함하여 클라이언트에서 직접 설정할 수 있도록 함
          res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            isAdmin: user.isAdmin,
            subscriptionTier: user.subscriptionTier,
            canGenerateContent: user.canGenerateContent,
            canGenerateImages: user.canGenerateImages,
            canUseChatbot: user.canUseChatbot,
            sessionId: req.sessionID // 세션 ID 포함
          });
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      // 우선순위: 1. session.userId (manual login), 2. passport.user (OAuth login)
      let userId = (req.session as any)?.userId;
      
      // passport OAuth 로그인 사용자 확인 (session.userId가 없는 경우)
      if (!userId && (req.session as any)?.passport?.user) {
        userId = (req.session as any).passport.user;
      }
      
      // 쿠키 세션이 없으면 Authorization 헤더 확인
      if (!userId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        
        // 세션 스토어에서 토큰으로 세션 검색
        try {
          const sessionStore = req.sessionStore;
          if (sessionStore && sessionStore.get) {
            await new Promise<void>((resolve, reject) => {
              sessionStore.get(token, (err: any, session: any) => {
                if (!err && session && session.userId) {
                  userId = session.userId;
                }
                resolve();
              });
            });
          }
        } catch (error) {
          // Silent fail for session lookup
        }
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        subscriptionTier: user.subscriptionTier,
        canGenerateContent: user.canGenerateContent,
        canGenerateImages: user.canGenerateImages,
        canUseChatbot: user.canUseChatbot
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;

      // 입력 검증
      if (!email || !password || !name) {
        return res.status(400).json({ message: "모든 필드를 입력해주세요" });
      }
      
      // 이메일 중복 확인
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "이미 등록된 이메일입니다" });
      }
      
      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 슈퍼유저 계정 확인 (환경변수에서 설정)
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
      const isSuper = Boolean(superAdminEmail && email === superAdminEmail);
      
      // 사용자 생성
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name: isSuper ? "슈퍼 관리자" : name,
        phone: phone || null,
        isAdmin: isSuper,
        subscriptionTier: isSuper ? "premium" : "free",
        canGenerateContent: true,
        canGenerateImages: isSuper,
        canUseChatbot: isSuper,
      });
      
      // 세션에 사용자 정보 저장
      (req.session as any).userId = user.id;
      console.log("Signup - Session set:", req.session);
      console.log("Signup - Session ID:", req.sessionID);
      
      // 세션 저장 완료 대기
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Signup - Session save error:", err);
            reject(err);
          } else {
            console.log("Signup - Session saved successfully");
            resolve();
          }
        });
      });
      
      // 비밀번호 제외하고 응답 (세션 ID 포함)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        sessionId: req.sessionID
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다" });
    }
  });

  // Logout endpoint - 최대한 단순하게 처리
  app.post("/api/auth/logout", (req, res) => {
    console.log("Logout request received");
    
    // 세션과 쿠키만 정리하고 즉시 응답
    try {
      // 쿠키 삭제 (여러 옵션으로 시도)
      res.clearCookie('connect.sid');
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
    } catch (e) {
      console.log("Cookie clear warning:", e);
    }
    
    // 즉시 성공 응답
    return res.status(200).json({ success: true, message: "로그아웃되었습니다" });
  });
  
  // Update user profile (name, phone)
  app.put("/api/user/profile", async (req, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name, phone } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;

      const user = await storage.updateUser(userId, updates);
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        subscriptionTier: user.subscriptionTier,
        canGenerateContent: user.canGenerateContent,
        canGenerateImages: user.canGenerateImages,
        canUseChatbot: user.canUseChatbot,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "프로필 업데이트 중 오류가 발생했습니다" });
    }
  });

  // ===== BLOG PROJECT ROUTES =====

  // Create new blog project
  app.post("/api/projects", async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        return res.status(400).json({ error: "키워드를 입력해주세요" });
      }

      const userId = await getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const project = await storage.createBlogProject({
        keyword: keyword.trim(),
        status: "keyword_analysis",
        userId: userId,
      });

      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ error: "프로젝트 생성에 실패했습니다" });
    }
  });

  // Get all projects for user
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const projects = await storage.getBlogProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      console.error("Projects fetch error:", error);
      res.status(500).json({ error: "프로젝트 목록 조회에 실패했습니다" });
    }
  });

  // Get specific project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // 프로젝트 소유권 확인
      if (project.userId !== userId) {
        return res.status(403).json({ error: "접근 권한이 없습니다" });
      }

      res.json(project);
    } catch (error) {
      console.error("Project fetch error:", error);
      res.status(500).json({ error: "프로젝트 조회에 실패했습니다" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      // 프로젝트 소유권 확인
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: "삭제 권한이 없습니다" });
      }

      const success = await storage.deleteBlogProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Project deletion error:", error);
      res.status(500).json({ error: "프로젝트 삭제에 실패했습니다" });
    }
  });

  // ===== IMAGE DOWNLOAD =====

  app.get("/api/projects/:id/images/:imageIndex", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageIndex = parseInt(req.params.imageIndex);

      const project = await storage.getBlogProject(id);
      if (!project || !project.generatedImages) {
        return res.status(404).json({ error: "이미지를 찾을 수 없습니다" });
      }

      const images = project.generatedImages as string[];
      if (imageIndex < 0 || imageIndex >= images.length || !images[imageIndex]) {
        return res.status(404).json({ error: "이미지를 찾을 수 없습니다" });
      }

      const imageUrl = images[imageIndex];

      // data URL인 경우 base64에서 바이너리로 변환
      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ error: "잘못된 이미지 데이터입니다" });
        }
        const mimeType = matches[1];
        const base64Data = matches[2];
        const imageBuffer = Buffer.from(base64Data, "base64");

        const ext = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="infographic-${encodeURIComponent(project.keyword)}-${imageIndex + 1}.${ext}"`);
        res.setHeader("Content-Length", imageBuffer.length.toString());
        return res.send(imageBuffer);
      }

      // 외부 URL인 경우 프록시
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(404).json({ error: "이미지 다운로드에 실패했습니다" });
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="infographic-${encodeURIComponent(project.keyword)}-${imageIndex + 1}.png"`);
      res.setHeader("Content-Length", imageBuffer.length.toString());
      res.send(imageBuffer);
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ error: "이미지 다운로드에 실패했습니다" });
    }
  });

  // ===== KEYWORD ANALYSIS =====
  
  app.post("/api/projects/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // Analyze keyword using Gemini
      const analysis = await analyzeKeyword(project.keyword);
      
      const updatedProject = await storage.updateBlogProject(id, {
        keywordAnalysis: analysis,
        subtitles: analysis.suggestedSubtitles,
        status: "data_collection",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Keyword analysis error:", error);
      res.status(500).json({ error: "키워드 분석에 실패했습니다" });
    }
  });

  // ===== RESEARCH DATA COLLECTION =====
  
  app.post("/api/projects/:id/research", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // Search research data using Perplexity
      const subtitles = project.subtitles as string[] || [];
      const researchData = await searchResearch(project.keyword, subtitles);
      
      const updatedProject = await storage.updateBlogProject(id, {
        researchData,
        status: "business_info",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Research error:", error);
      res.status(500).json({ error: "연구 자료 수집에 실패했습니다" });
    }
  });

  // ===== BUSINESS INFO =====
  
  app.post("/api/projects/:id/business-info", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessInfoData = businessInfoSchema.parse(req.body);
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const updatedProject = await storage.updateBlogProject(id, {
        businessInfo: businessInfoData,
        status: "business_info",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Business info error:", error);
      res.status(500).json({ error: "업체 정보 저장에 실패했습니다" });
    }
  });

  // ===== KEYWORD ANALYSIS UPDATE =====
  
  app.put("/api/projects/:id/keyword-analysis", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { searchIntent, userConcerns } = req.body;
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const currentAnalysis = project.keywordAnalysis || {};
      const updatedAnalysis = {
        ...currentAnalysis,
        ...(searchIntent !== undefined && { searchIntent }),
        ...(userConcerns !== undefined && { userConcerns })
      };

      const updatedProject = await storage.updateBlogProject(id, {
        keywordAnalysis: updatedAnalysis,
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Keyword analysis update error:", error);
      res.status(500).json({ error: "키워드 분석 업데이트에 실패했습니다" });
    }
  });

  // ===== SUBTITLE MANAGEMENT =====
  
  app.post("/api/projects/:id/subtitles", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { subtitles } = req.body;
      
      if (!Array.isArray(subtitles)) {
        return res.status(400).json({ error: "소제목은 배열 형태여야 합니다" });
      }
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const updatedProject = await storage.updateBlogProject(id, {
        subtitles,
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Subtitle update error:", error);
      res.status(500).json({ error: "소제목 업데이트에 실패했습니다" });
    }
  });

  // ===== CUSTOM MORPHEMES =====
  
  app.post("/api/projects/:id/custom-morphemes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { customMorphemes } = req.body;
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const updatedProject = await storage.updateBlogProject(id, {
        customMorphemes,
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Custom morphemes update error:", error);
      res.status(500).json({ error: "추가 형태소 업데이트에 실패했습니다" });
    }
  });

  // Generate blog content
  app.post("/api/projects/:id/generate", async (req, res) => {
    try {
      // 타임아웃 연장: 콘텐츠 생성은 3회 시도로 최대 2-3분 소요 가능
      req.setTimeout(180000); // 3분 (180초)
      res.setTimeout(180000);
      
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // 사용자 인증 및 무료 횟수 체크
      const userId = project.userId;
      if (!userId) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "사용자를 찾을 수 없습니다" });
      }

      // 슈퍼관리자 또는 유료 구독자는 무제한
      const isAdmin = user.isAdmin;
      const hasActiveSubscription = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
      const hadPreviousSubscription = user.subscriptionExpiresAt !== null; // 이전에 구독한 적이 있는지

      if (!isAdmin && !hasActiveSubscription) {
        // 이전에 구독했던 사용자 - 구독 만료 시 무료 체험 없이 바로 결제 필요
        if (hadPreviousSubscription) {
          const expiredAt = new Date(user.subscriptionExpiresAt!);
          return res.status(403).json({ 
            error: "구독이 만료되었습니다",
            code: "SUBSCRIPTION_EXPIRED",
            expiredAt: expiredAt.toISOString(),
            message: "계속 사용하시려면 구독을 갱신해주세요"
          });
        }
        
        // 신규 사용자 - 3회 무료 체험 제한 체크
        const freeCount = user.freeGenerationCount || 0;
        if (freeCount >= 3) {
          return res.status(403).json({ 
            error: "무료 체험 횟수를 모두 사용하셨습니다",
            code: "FREE_LIMIT_EXCEEDED",
            freeCount: freeCount,
            maxFreeCount: 3,
            message: "계속 사용하시려면 구독이 필요합니다"
          });
        }
      }

      // First update status to show generation is starting
      await storage.updateBlogProject(id, {
        status: "content_generation",
      });

      // Generate blog content using Anthropic
      const strictMorphemeGenerator = await import('./services/strictMorphemeGenerator');
      
      const generationResult = await strictMorphemeGenerator.generateStrictMorphemeContent(
        project.keyword,
        project.subtitles as string[],
        project.researchData as any,
        project.businessInfo as any,
        undefined, // referenceLinks
        project.customMorphemes as string | undefined,
        (project.keywordAnalysis as any)?.searchIntent,
        (project.keywordAnalysis as any)?.userConcerns
      );
      
      const finalContent = generationResult.content;
      const seoAnalysis = generationResult.analysis;
      
      console.log(`Content generation completed in ${generationResult.attempts} attempts. Success: ${generationResult.success}`);

      // ✅ 3번 시도 후 조건 미달성이어도 현재 상태 그대로 저장
      // 사용자에게 경고와 함께 콘텐츠 전달
      let projectStatus = "completed";
      let warningMessage = null;
      
      if (!generationResult.success) {
        console.log(`⚠️ SEO 최적화 조건 미달성, 현재 상태 그대로 저장`);
        projectStatus = "completed_with_warnings";
        warningMessage = {
          type: "seo_optimization_incomplete",
          message: `${generationResult.attempts}회 시도 후 일부 SEO 조건 미달성. 콘텐츠는 저장되었으나 수동 수정이 필요할 수 있습니다.`,
          analysis: seoAnalysis,
          issues: seoAnalysis.issues || [],
          suggestions: seoAnalysis.suggestions || []
        };
      }

      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: finalContent,
        seoMetrics: seoAnalysis,
        status: projectStatus === "completed_with_warnings" ? "completed" : projectStatus,
      });

      // 무료 체험 사용자인 경우에만 생성 횟수 증가 (구독 만료 사용자는 제외)
      if (!isAdmin && !hasActiveSubscription && !hadPreviousSubscription) {
        try {
          await storage.incrementFreeGenerationCount(userId);
          console.log(`Free generation count incremented for user ${userId}`);
        } catch (countError) {
          console.error("Failed to increment free generation count:", countError);
        }
      }

      // 활동 로그 기록
      try {
        await storage.createActivityLog({
          userId: userId,
          activityType: 'content_generated',
          projectId: id,
          tokensUsed: finalContent.length, // 대략적인 토큰 수 (글자 수로 대체)
          details: {
            keyword: project.keyword,
            characterCount: finalContent.length,
            seoOptimized: generationResult.success,
            attempts: generationResult.attempts,
          }
        });
        console.log(`Activity log created for user ${userId}`);
      } catch (logError) {
        console.error("Failed to create activity log:", logError);
      }

      // 완성된 글을 작성 내역에 저장
      try {
        await storage.createCompletedProject({
          userId: updatedProject.userId!,
          title: null, // 제목은 추후 채팅으로 생성할 수 있음
          keyword: updatedProject.keyword,
          content: finalContent,
          referenceData: updatedProject.researchData as any,
          seoMetrics: seoAnalysis as any,
        });
        console.log(`Completed project saved for user ${updatedProject.userId}, keyword: ${updatedProject.keyword}`);
      } catch (saveError) {
        console.error("Failed to save completed project:", saveError);
        // 저장 실패해도 메인 프로세스는 계속 진행
      }

      // 글 완성 시 자동으로 세션 저장
      try {
        const chatHistory = await storage.getChatMessages(id);
        const sessionName = `${updatedProject.keyword} - ${new Date().toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
        
        await storage.createProjectSession({
          userId: updatedProject.userId!,
          projectId: id,
          sessionName,
          sessionDescription: '자동 저장된 완성 글',
          keyword: updatedProject.keyword,
          keywordAnalysis: updatedProject.keywordAnalysis as any,
          subtitles: updatedProject.subtitles as any,
          researchData: updatedProject.researchData as any,
          businessInfo: updatedProject.businessInfo as any,
          generatedContent: finalContent,
          seoMetrics: seoAnalysis as any,
          referenceLinks: updatedProject.referenceLinks as any,
          generatedImages: updatedProject.generatedImages as any,
          referenceBlogLinks: updatedProject.referenceBlogLinks as any,
          customMorphemes: updatedProject.customMorphemes || null,
          chatHistory: chatHistory as any,
        });
        console.log(`Session automatically saved for project ${id}`);
      } catch (sessionError) {
        console.error("Failed to save session:", sessionError);
        // 세션 저장 실패해도 메인 프로세스는 계속 진행
      }

      // 경고 메시지가 있으면 함께 반환
      if (warningMessage) {
        res.json({
          ...updatedProject,
          warning: warningMessage
        });
      } else {
        res.json(updatedProject);
      }
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ error: "블로그 생성에 실패했습니다" });
    }
  });

  // Regenerate content
  app.post("/api/projects/:id/regenerate", async (req, res) => {
    try {
      // 타임아웃 연장: 재생성도 3회 시도로 최대 2-3분 소요 가능
      req.setTimeout(180000); // 3분
      res.setTimeout(180000);
      
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const { regenerateWithStrictMorphemes } = await import('./services/strictMorphemeGenerator.js');
      
      const regenerationResult = await regenerateWithStrictMorphemes(
        project.generatedContent || '',
        project.keyword,
        project.subtitles as string[],
        project.researchData as any,
        project.businessInfo as any,
        project.customMorphemes as string | undefined,
        (project.keywordAnalysis as any)?.searchIntent,
        (project.keywordAnalysis as any)?.userConcerns
      );
      
      const finalContent = regenerationResult.content;
      const seoAnalysis = regenerationResult.analysis;
      
      console.log(`Content regeneration completed in ${regenerationResult.attempts} attempts. Success: ${regenerationResult.success}`);

      // ✅ 3번 시도 후 조건 미달성이어도 현재 상태 그대로 저장
      let projectStatus = "completed";
      let warningMessage = null;
      
      if (!regenerationResult.success) {
        console.log(`⚠️ SEO 최적화 조건 미달성, 현재 상태 그대로 저장`);
        projectStatus = "completed_with_warnings";
        warningMessage = {
          type: "seo_optimization_incomplete",
          message: `${regenerationResult.attempts}회 시도 후 일부 SEO 조건 미달성. 콘텐츠는 저장되었으나 수동 수정이 필요할 수 있습니다.`,
          analysis: seoAnalysis,
          issues: seoAnalysis.issues || [],
          suggestions: seoAnalysis.suggestions || []
        };
      }

      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: finalContent,
        seoMetrics: seoAnalysis,
        status: projectStatus === "completed_with_warnings" ? "completed" : projectStatus,
      });

      // 재생성 시에도 자동으로 세션 저장
      try {
        const chatHistory = await storage.getChatMessages(id);
        const sessionName = `${updatedProject.keyword} - ${new Date().toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
        
        await storage.createProjectSession({
          userId: updatedProject.userId!,
          projectId: id,
          sessionName,
          sessionDescription: '재생성 후 자동 저장된 글',
          keyword: updatedProject.keyword,
          keywordAnalysis: updatedProject.keywordAnalysis as any,
          subtitles: updatedProject.subtitles as any,
          researchData: updatedProject.researchData as any,
          businessInfo: updatedProject.businessInfo as any,
          generatedContent: finalContent,
          seoMetrics: seoAnalysis as any,
          referenceLinks: updatedProject.referenceLinks as any,
          generatedImages: updatedProject.generatedImages as any,
          referenceBlogLinks: updatedProject.referenceBlogLinks as any,
          customMorphemes: updatedProject.customMorphemes || null,
          chatHistory: chatHistory as any,
        });
        console.log(`Session automatically saved after regeneration for project ${id}`);
      } catch (sessionError) {
        console.error("Failed to save session after regeneration:", sessionError);
        // 세션 저장 실패해도 메인 프로세스는 계속 진행
      }

      // 경고 메시지가 있으면 함께 반환
      if (warningMessage) {
        res.json({
          ...updatedProject,
          warning: warningMessage
        });
      } else {
        res.json(updatedProject);
      }
    } catch (error) {
      console.error("Content regeneration error:", error);
      res.status(500).json({ error: "블로그 재생성에 실패했습니다" });
    }
  });

  // 🆕 Re-optimize content (부분 최적화만 수행)
  app.post("/api/projects/:id/reoptimize", async (req, res) => {
    try {
      req.setTimeout(120000); // 2분
      res.setTimeout(120000);
      
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      if (!project.generatedContent) {
        return res.status(400).json({ error: "생성된 콘텐츠가 없습니다" });
      }

      const { optimizeIncrementally } = await import('./services/incrementalOptimizer');
      const { analyzeMorphemes } = await import('./services/morphemeAnalyzer');
      
      console.log(`🔄 부분 최적화 시작: 프로젝트 ${id}`);
      
      const optimizationResult = await optimizeIncrementally(
        project.generatedContent,
        project.keyword,
        project.customMorphemes as string | undefined
      );
      
      // 최적화 후 분석
      const seoAnalysis = await analyzeMorphemes(
        optimizationResult.content,
        project.keyword,
        project.customMorphemes as string | undefined
      );
      
      console.log(`✅ 부분 최적화 완료: ${optimizationResult.success ? '성공' : '일부 미달'}`);

      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: optimizationResult.content,
        seoMetrics: seoAnalysis,
      });

      res.json({
        ...updatedProject,
        optimizationResult: {
          success: optimizationResult.success,
          fixed: optimizationResult.fixed
        }
      });
    } catch (error) {
      console.error("Re-optimization error:", error);
      res.status(500).json({ error: "부분 최적화에 실패했습니다" });
    }
  });

  // Copy content (normal or mobile)
  app.post("/api/projects/:id/copy", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { format } = req.body; // 'normal' or 'mobile'
      
      const project = await storage.getBlogProject(id);
      if (!project || !project.generatedContent) {
        return res.status(404).json({ error: "생성된 콘텐츠를 찾을 수 없습니다" });
      }

      let content = project.generatedContent;
      
      if (format === 'mobile') {
        const useSmart = req.query.smart === 'true';
        
        if (useSmart) {
          // AI 기반 스마트 포맷팅: 문맥과 의미를 이해한 자연스러운 줄바꿈
          content = await formatForMobileSmartBatch(project.generatedContent);
        } else {
          // 규칙 기반 포맷팅: 한국어 기준 자연스러운 줄바꿈 (27자 기준)
          content = formatForMobile(project.generatedContent);
        }
      }

      res.json({ content });
    } catch (error) {
      console.error("Copy content error:", error);
      res.status(500).json({ error: "콘텐츠 복사에 실패했습니다" });
    }
  });


  // ===== CHAT FUNCTIONALITY =====
  
  // Send chat message (content editing or title generation)
  app.post("/api/projects/:id/chat", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "메시지를 입력해주세요" });
      }

      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // 챗봇 사용 권한 체크 (프리미엄 전용)
      const userId = project.userId;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && !user.isAdmin && !user.canUseChatbot) {
          return res.status(403).json({ 
            error: "AI 챗봇은 프리미엄 플랜 전용 기능입니다",
            code: "CHATBOT_NOT_ALLOWED",
            message: "프리미엄 플랜으로 업그레이드하시면 AI 챗봇을 이용하실 수 있습니다"
          });
        }
      }

      // Save user message
      await storage.createChatMessage({
        projectId: id,
        role: "user",
        content: message,
      });
      // Check if this is an image request
      const isImageRequest = /이미지|그림|사진|인포그래픽|infographic|그려|일러스트/i.test(message);
      const isInfographicRequest = /인포그래픽|infographic|도표|차트|시각화|다이어그램/i.test(message);

      if (isImageRequest) {
        // 🔒 이미지 생성은 슈퍼유저(admin)만 가능
        let isAdminUser = false;
        if (userId) {
          const user = await storage.getUser(userId);
          if (user?.isAdmin) {
            isAdminUser = true;
          }
        }

        if (!isAdminUser) {
          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: "이미지 생성은 관리자 전용 기능입니다.\n\n외부 도구를 사용해주세요:\nGoogle Whisk: https://labs.google/fx/tools/whisk\nNapkin AI: https://www.napkin.ai/",
          });

          return res.json({ 
            success: true, 
            type: 'external_tool_guide',
          });
        }

        try {
          const { generateChatImage, generateInfographicHTML } = await import("./services/geminiImageGenerator.js");

          if (isInfographicRequest) {
            // 인포그래픽 생성
            await storage.createChatMessage({
              projectId: id,
              role: "assistant",
              content: "인포그래픽을 생성하고 있습니다... 잠시만 기다려주세요.",
            });

            const subtitles = (project.subtitles as string[]) || [];
            const result = await generateInfographicHTML(
              project.keyword,
              project.generatedContent || "",
              subtitles
            );

            const imageUrl = `data:${result.mimeType || "image/png"};base64,${result.imageBase64}`;

            await storage.createChatMessage({
              projectId: id,
              role: "assistant",
              content: "인포그래픽이 생성되었습니다!\n\nNano Banana Pro로 고품질 인포그래픽이 생성되었습니다.\n다른 스타일이나 수정이 필요하시면 말씀해주세요.",
              imageUrl,
            });

            const existingImages = (project.generatedImages as string[]) || [];
            existingImages.push(imageUrl);
            await storage.updateBlogProject(id, {
              generatedImages: existingImages as any,
            });

            return res.json({
              success: true,
              type: 'image',
              imageUrl,
            });
          } else {
            // 일반 이미지 생성 (다중 이미지 지원)
            const countMatch = message.match(/(\d+)\s*(?:장|개|매|개씩|장씩)/);
            const requestedCount = countMatch ? Math.min(parseInt(countMatch[1]), 10) : 1;

            await storage.createChatMessage({
              projectId: id,
              role: "assistant",
              content: requestedCount > 1
                ? `이미지 ${requestedCount}장을 생성하고 있습니다... 잠시만 기다려주세요.`
                : "이미지를 생성하고 있습니다... 잠시만 기다려주세요.",
            });

            const results = await generateChatImage(
              message,
              project.keyword,
              project.generatedContent || ""
            );

            const existingImages = (project.generatedImages as string[]) || [];
            const imageUrls: string[] = [];

            for (let i = 0; i < results.length; i++) {
              const r = results[i];
              const imgUrl = `data:${r.mimeType};base64,${r.imageBase64}`;
              imageUrls.push(imgUrl);
              existingImages.push(imgUrl);

              await storage.createChatMessage({
                projectId: id,
                role: "assistant",
                content: results.length > 1
                  ? `이미지 ${i + 1}/${results.length}`
                  : "이미지가 생성되었습니다!\n\n다른 스타일이나 추가 이미지가 필요하시면 말씀해주세요.\n(예: \"사진 5장 그려줘\", \"인포그래픽으로 만들어줘\")",
                imageUrl: imgUrl,
              });
            }

            if (results.length > 1) {
              await storage.createChatMessage({
                projectId: id,
                role: "assistant",
                content: `${results.length}장의 이미지가 생성되었습니다! 각 이미지를 개별 다운로드할 수 있습니다.\n\n(예: \"사진 5장 그려줘\", \"인포그래픽으로 만들어줘\", \"일러스트 3장\")`,
              });
            }

            await storage.updateBlogProject(id, {
              generatedImages: existingImages as any,
            });

            return res.json({
              success: true,
              type: 'image',
              imageUrls,
              imageCount: results.length,
            });
          }
        } catch (imageError: any) {
          console.error("이미지 생성 에러:", imageError);

          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: `이미지 생성에 실패했습니다.\n\n오류: ${imageError?.message || "알 수 없는 오류"}\n\n외부 도구를 사용해보세요:\nGoogle Whisk: https://labs.google/fx/tools/whisk\nNapkin AI: https://www.napkin.ai/`,
          });

          return res.json({
            success: true,
            type: 'error',
            message: imageError?.message || "이미지 생성 실패",
          });
        }
      } else {
        // Regular content editing - Enhanced version
        if (!project.generatedContent) {
          return res.status(404).json({ error: "편집할 콘텐츠가 없습니다" });
        }

        try {
          const { enhancedEditContent, analyzeUserRequest, generateContentBasedTitle } = await import("./services/enhancedChatbot.js");
          
          const quickAnalysis = await analyzeUserRequest(message, project.generatedContent, project.keyword);
          
          if (quickAnalysis.intent === 'title_suggestion') {
            const titlesWithScores = await generateContentBasedTitle(
              project.generatedContent,
              project.keyword,
              quickAnalysis
            );
            
            let titleResponse = `SSR 평가 기반 Top 5 제목 추천\n\n`;
            titleResponse += `25가지 스타일로 제목 생성 후 클릭 유도력 평가\n`;
            titleResponse += `가장 효과적인 상위 5개 제목을 선정했습니다!\n\n`;

            titlesWithScores.forEach((item: any, index: number) => {
              const stars = '⭐'.repeat(Math.round(item.score));
              titleResponse += `${index + 1}. ${item.title}\n`;
              titleResponse += `   ${stars} ${item.score.toFixed(1)}점\n\n`;
            });

            const avgScore = titlesWithScores.reduce((sum: number, t: any) => sum + t.score, 0) / titlesWithScores.length;
            titleResponse += `평균 점수: ${avgScore.toFixed(1)}/5.0\n\n`;
            titleResponse += `마음에 드는 제목을 선택하시거나,\n"더 흥미롭게", "더 전문적으로" 등 스타일을 요청하시면\n다시 만들어드릴게요!`;
            
            await storage.createChatMessage({
              projectId: id,
              role: "assistant",
              content: titleResponse,
            });
            
            return res.json({ 
              success: true, 
              type: 'title',
              titles: titlesWithScores,
              message: titleResponse
            });
          }
          
          const result = await enhancedEditContent(
            project.generatedContent,
            message,
            project.keyword,
            project.customMorphemes || undefined
          );

          const editedContent = result.bestVersion;
          
          const { analyzeMorphemes } = await import("./services/morphemeAnalyzer.js");
          const morphemeAnalysis = await analyzeMorphemes(editedContent, project.keyword, project.customMorphemes || undefined);
          
          let responseMessage = `콘텐츠 수정 완료\n\n`;
          responseMessage += `요청 분석:\n`;
          responseMessage += `• 수정 의도: ${result.analysis.intent}\n`;
          responseMessage += `• 수정 대상: ${result.analysis.target}\n`;
          responseMessage += `• 적용 전략: ${result.analysis.persuasionStrategy}\n\n`;

          responseMessage += `최적 버전 선택 (${result.allVersions.length}개 버전 중):\n`;
          responseMessage += `• 품질 점수: ${result.allVersions[0]?.score.toFixed(1)}/10\n`;

          if (result.allVersions[0]?.strengths.length > 0) {
            responseMessage += `• 강점: ${result.allVersions[0].strengths.slice(0, 2).join(', ')}\n`;
          }

          if (!morphemeAnalysis.isOptimized) {
            responseMessage += `\nSEO 최적화 상태:\n${morphemeAnalysis.issues.slice(0, 3).join('\n')}`;
          } else {
            responseMessage += `\nSEO 최적화 조건 충족`;
          }

          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: responseMessage,
          });

          const seoAnalysis = await analyzeSEOOptimization(editedContent, project.keyword);
          const updatedProject = await storage.updateBlogProject(id, {
            generatedContent: editedContent,
            seoMetrics: seoAnalysis,
          });

          res.json({ 
            success: true, 
            type: 'edit', 
            project: updatedProject,
            analysis: result.analysis,
            versions: result.allVersions.map((v: any) => ({
              score: v.score,
              strengths: v.strengths,
              weaknesses: v.weaknesses
            }))
          });
        } catch (enhancedError) {
          console.error("Enhanced chatbot error, falling back:", enhancedError);
          
          const { editContent } = await import("./services/gemini.js");
          const editedContent = await editContent(
            project.generatedContent,
            message,
            project.keyword,
            project.customMorphemes || undefined
          );

          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: "콘텐츠가 수정되었습니다.",
          });

          const seoAnalysis = await analyzeSEOOptimization(editedContent, project.keyword);
          const updatedProject = await storage.updateBlogProject(id, {
            generatedContent: editedContent,
            seoMetrics: seoAnalysis,
          });

          res.json({ success: true, type: 'edit', project: updatedProject });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "채팅 처리에 실패했습니다" });
    }
  });

  // Get chat messages
  app.get("/api/projects/:id/chat", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const messages = await storage.getChatMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Chat fetch error:", error);
      res.status(500).json({ error: "채팅 내역 조회에 실패했습니다" });
    }
  });

  // 자동 이미지 생성 API (admin 전용) - 문단별 이미지 자동 제안/생성
  app.post("/api/projects/:id/auto-images", async (req, res) => {
    try {
      req.setTimeout(180000); // 3분 (여러 이미지 생성)
      res.setTimeout(180000);

      const id = parseInt(req.params.id);
      const { generateAll } = req.body; // true면 모든 문단, false면 high priority만

      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // admin 권한 체크
      const userId = project.userId;
      if (userId) {
        const user = await storage.getUser(userId);
        if (!user?.isAdmin) {
          return res.status(403).json({ error: "이미지 생성은 관리자 전용 기능입니다" });
        }
      }

      if (!project.generatedContent) {
        return res.status(400).json({ error: "생성된 콘텐츠가 없습니다" });
      }

      const { generateAutoImages } = await import("./services/geminiImageGenerator.js");

      const subtitles = (project.subtitles as string[]) || [];
      const result = await generateAutoImages(
        project.keyword,
        project.generatedContent,
        subtitles,
        generateAll || false
      );

      // 생성된 이미지를 프로젝트에 저장
      if (result.generatedImages.length > 0) {
        const existingImages = (project.generatedImages as string[]) || [];
        const newImageUrls = result.generatedImages.map(
          img => `data:${img.mimeType};base64,${img.imageBase64}`
        );
        existingImages.push(...newImageUrls);

        await storage.updateBlogProject(id, {
          generatedImages: existingImages as any,
        });
      }

      res.json({
        success: true,
        suggestions: result.suggestions,
        generatedCount: result.generatedImages.length,
        images: result.generatedImages.map(img => ({
          paragraphIndex: img.paragraphIndex,
          subtitle: img.subtitle,
          imageUrl: `data:${img.mimeType};base64,${img.imageBase64}`,
        })),
      });
    } catch (error: any) {
      console.error("Auto image generation error:", error);
      res.status(500).json({ error: error?.message || "자동 이미지 생성에 실패했습니다" });
    }
  });

  // ===== PROJECT SESSION MANAGEMENT =====

  
  // Save project as session
  app.post("/api/projects/:id/sessions", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { sessionName, sessionDescription } = req.body;
      
      console.log(`[세션 저장] 시작 - 프로젝트 ID: ${projectId}`);
      
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        console.log("[세션 저장] 실패 - 인증 필요");
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      console.log(`[세션 저장] 사용자 ID: ${userId}`);

      // Get current project state
      const project = await storage.getBlogProject(projectId);
      if (!project) {
        console.log(`[세션 저장] 실패 - 프로젝트 없음: ${projectId}`);
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      console.log(`[세션 저장] 프로젝트 조회 성공 - 키워드: ${project.keyword}`);

      // Get chat history
      const chatHistory = await storage.getChatMessages(projectId);
      console.log(`[세션 저장] 채팅 히스토리 조회 완료 - 메시지 수: ${chatHistory.length}`);

      // Create session snapshot with safe defaults
      const sessionData = {
        userId,
        projectId,
        sessionName: sessionName || `${project.keyword} - ${new Date().toLocaleDateString('ko-KR')}`,
        sessionDescription: sessionDescription || null,
        keyword: project.keyword,
        keywordAnalysis: project.keywordAnalysis || null,
        subtitles: project.subtitles || null,
        researchData: project.researchData || null,
        businessInfo: project.businessInfo || null,
        generatedContent: project.generatedContent || null,
        seoMetrics: project.seoMetrics || null,
        referenceLinks: project.referenceLinks || null,
        generatedImages: project.generatedImages || null,
        referenceBlogLinks: project.referenceBlogLinks || null,
        customMorphemes: project.customMorphemes || null,
        chatHistory: chatHistory || [], // Store as JSON array
      };

      console.log(`[세션 저장] 세션 데이터 준비 완료`);

      const session = await storage.createProjectSession(sessionData as any);
      
      console.log(`[세션 저장] 성공 - 세션 ID: ${session.id}`);

      res.json({ success: true, session });
    } catch (error) {
      console.error("[세션 저장] 에러 상세:", error);
      console.error("[세션 저장] 에러 스택:", (error as Error).stack);
      res.status(500).json({ 
        error: "세션 저장에 실패했습니다",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Get all sessions for user
  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const sessions = await storage.getProjectSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "세션 목록 조회에 실패했습니다" });
    }
  });

  // Load session into a new or existing project
  app.post("/api/sessions/:sessionId/load", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { createNew } = req.body; // Whether to create new project or update existing
      
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      // Get session data
      const session = await storage.getProjectSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "세션을 찾을 수 없습니다" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ error: "권한이 없습니다" });
      }

      // Create new project or update existing
      let project;
      if (createNew || !session.projectId) {
        // Create new project from session
        project = await storage.createBlogProject({
          userId,
          keyword: session.keyword,
          status: 'completed',
          keywordAnalysis: session.keywordAnalysis as any,
          subtitles: session.subtitles as any,
          researchData: session.researchData as any,
          businessInfo: session.businessInfo as any,
          generatedContent: session.generatedContent,
          seoMetrics: session.seoMetrics as any,
          referenceLinks: session.referenceLinks as any,
          generatedImages: session.generatedImages as any,
          referenceBlogLinks: session.referenceBlogLinks as any,
          customMorphemes: session.customMorphemes,
        });

        // Restore chat history
        if (session.chatHistory && Array.isArray(session.chatHistory)) {
          for (const msg of session.chatHistory as any[]) {
            await storage.createChatMessage({
              projectId: project.id,
              role: msg.role,
              content: msg.content,
              imageUrl: msg.imageUrl,
            });
          }
        }
      } else {
        // Update existing project
        project = await storage.updateBlogProject(session.projectId, {
          keyword: session.keyword,
          keywordAnalysis: session.keywordAnalysis as any,
          subtitles: session.subtitles as any,
          researchData: session.researchData as any,
          businessInfo: session.businessInfo as any,
          generatedContent: session.generatedContent,
          seoMetrics: session.seoMetrics as any,
          referenceLinks: session.referenceLinks as any,
          generatedImages: session.generatedImages as any,
          referenceBlogLinks: session.referenceBlogLinks as any,
          customMorphemes: session.customMorphemes,
        });
      }

      res.json({ success: true, project });
    } catch (error) {
      console.error("Load session error:", error);
      res.status(500).json({ error: "세션 불러오기에 실패했습니다" });
    }
  });

  // Delete session
  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      // Verify ownership
      const session = await storage.getProjectSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "세션을 찾을 수 없습니다" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ error: "권한이 없습니다" });
      }

      await storage.deleteProjectSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "세션 삭제에 실패했습니다" });
    }
  });

  // ===== BUSINESS INFO ROUTES =====
  
  // Get user business info
  app.get("/api/user/business-info", async (req, res) => {
    try {
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const businessInfos = await storage.getAllUserBusinessInfos(userId);
      res.json(businessInfos);
    } catch (error) {
      console.error("Get business info error:", error);
      res.status(500).json({ error: "업체 정보 조회에 실패했습니다" });
    }
  });

  // Get all user business infos for selection
  app.get("/api/user/business-infos", async (req, res) => {
    try {
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const businessInfos = await storage.getAllUserBusinessInfos(userId);
      res.json(businessInfos);
    } catch (error) {
      console.error("Get business infos error:", error);
      res.status(500).json({ error: "업체 정보 목록 조회에 실패했습니다" });
    }
  });

  // Create new business info
  app.post("/api/user/business-info", async (req, res) => {
    try {
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const businessInfoData = businessInfoSchema.parse(req.body);
      
      const businessInfo = await storage.createUserBusinessInfo({
        ...businessInfoData,
        userId,
      });
      
      res.json(businessInfo);
    } catch (error) {
      console.error("Create business info error:", error);
      res.status(500).json({ error: "업체 정보 생성에 실패했습니다" });
    }
  });

  // Update business info by ID
  app.put("/api/user/business-info/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      // 업체정보 소유권 확인 - ID로 조회 후 userId 비교
      const existingBusinessInfo = await storage.getBusinessInfoById(id);
      if (!existingBusinessInfo) {
        return res.status(404).json({ error: "업체 정보를 찾을 수 없습니다" });
      }
      if (existingBusinessInfo.userId !== userId) {
        return res.status(403).json({ error: "수정 권한이 없습니다" });
      }

      const businessInfoData = businessInfoSchema.parse(req.body);
      const businessInfo = await storage.updateUserBusinessInfoById(id, businessInfoData);
      res.json(businessInfo);
    } catch (error) {
      console.error("Update business info error:", error);
      res.status(500).json({ error: "업체 정보 수정에 실패했습니다" });
    }
  });

  // Delete business info by ID
  app.delete("/api/user/business-info/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      // 업체정보 소유권 확인 - ID로 조회 후 userId 비교
      const existingBusinessInfo = await storage.getBusinessInfoById(id);
      if (!existingBusinessInfo) {
        return res.status(404).json({ error: "업체 정보를 찾을 수 없습니다" });
      }
      if (existingBusinessInfo.userId !== userId) {
        return res.status(403).json({ error: "삭제 권한이 없습니다" });
      }

      const success = await storage.deleteUserBusinessInfo(id);
      res.json({ success });
    } catch (error) {
      console.error("Delete business info error:", error);
      res.status(500).json({ error: "업체 정보 삭제에 실패했습니다" });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // 슈퍼 관리자 권한 확인
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    const userId = await getAuthenticatedUserId(req);
    
    if (!userId) {
      return res.status(401).json({ error: "인증이 필요합니다" });
    }
    
    const user = await storage.getUserById(userId);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
    
    if (!user || !superAdminEmail || user.email !== superAdminEmail) {
      return res.status(403).json({ 
        error: "슈퍼 관리자만 접근할 수 있습니다" 
      });
    }
    next();
  };

  // 모든 사용자 조회 (슈퍼 관리자만)
  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ error: "사용자 목록 조회에 실패했습니다" });
    }
  });

  // 사용자 권한 업데이트 (슈퍼 관리자만) - 무통장 입금 후 수동으로 권한 부여
  app.put("/api/admin/users/:id/permissions", requireSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const permissions = updateUserPermissionsSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserPermissions(userId, permissions);
      res.json(updatedUser);
    } catch (error) {
      console.error("Admin update permissions error:", error);
      res.status(500).json({ error: "권한 업데이트에 실패했습니다" });
    }
  });

  // Make user admin by email (super admin only - for initial setup)
  app.post("/api/admin/make-admin", async (req, res) => {
    try {
      const { email, adminSecret } = req.body;
      
      // Simple secret check for initial admin setup
      if (adminSecret !== "blogcheatkey-admin-2025") {
        return res.status(403).json({ error: "잘못된 관리자 비밀번호입니다" });
      }
      
      const updatedUser = await storage.makeUserAdmin(email);
      if (!updatedUser) {
        return res.status(404).json({ error: "해당 이메일의 사용자를 찾을 수 없습니다" });
      }
      
      res.json({ message: "관리자 권한이 부여되었습니다", user: updatedUser });
    } catch (error) {
      console.error("Make admin error:", error);
      res.status(500).json({ error: "관리자 권한 부여에 실패했습니다" });
    }
  });

  // ===== COMPLETED PROJECTS (HISTORY) =====
  
  // Get completed projects for history page
  app.get("/api/completed-projects", async (req, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const completedProjects = await storage.getCompletedProjects(userId);
      res.json(completedProjects);
    } catch (error) {
      console.error("Get completed projects error:", error);
      res.status(500).json({ error: "작성 내역 조회에 실패했습니다" });
    }
  });

  // Save completed project (called when blog generation is finished)
  app.post("/api/completed-projects", async (req, res) => {
    try {
      // 실제 로그인한 사용자 ID 획득
      let userId = (req.session as any)?.userId;
      
      // Authorization 헤더에서 사용자 ID 획득 (localStorage 인증)

      if (!userId) {
        return res.status(401).json({ error: "인증이 필요합니다" });
      }

      const { title, keyword, content, referenceData, seoMetrics } = req.body;

      if (!keyword || !content) {
        return res.status(400).json({ error: "키워드와 콘텐츠는 필수입니다" });
      }

      const completedProject = await storage.createCompletedProject({
        userId,
        title: title || null,
        keyword,
        content,
        referenceData: referenceData || null,
        seoMetrics: seoMetrics || null,
      });

      res.json(completedProject);
    } catch (error) {
      console.error("Save completed project error:", error);
      res.status(500).json({ error: "완성된 글 저장에 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}