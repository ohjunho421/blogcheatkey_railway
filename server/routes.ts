import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { businessInfoSchema, keywordAnalysisSchema, seoMetricsSchema, emailSignupSchema, emailLoginSchema } from "@shared/schema";
import { analyzeKeyword, editContent, enhanceIntroductionAndConclusion } from "./services/gemini";
import { preparePayment, verifyPayment, cancelPayment, getPaymentHistory } from "./services/portone";
import passport from 'passport';
import { setupAuth, isAuthenticated, hashPassword } from './auth';
import { writeOptimizedBlogPost } from "./services/anthropic";
import { searchResearch, getDetailedResearch } from "./services/perplexity";
import { generateMultipleImages, generateImage } from "./services/imageGeneration";
import { analyzeSEOOptimization, formatForMobile } from "./services/seoOptimizer";
import { enhancedSEOAnalysis } from "./services/morphemeAnalyzer";
import { TitleGenerator } from "./services/titleGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication middleware
  setupAuth(app);
  
  // Health check endpoint should be at the top
  // Health check and ping endpoints are already handled in server/index.ts
  
  // ===== AUTHENTICATION ROUTES =====
  
  // Email signup
  app.post("/auth/signup", async (req, res) => {
    try {
      const validatedData = emailSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "이미 등록된 이메일입니다." });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        isEmailVerified: false
      });
      
      // Auto login after signup
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "회원가입 후 자동 로그인에 실패했습니다." });
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "회원가입에 실패했습니다." });
    }
  });
  
  // Email login
  app.post("/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다." });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "로그인에 실패했습니다." });
      }
      
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "로그인 세션 생성에 실패했습니다." });
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    })(req, res, next);
  });
  
  // Google OAuth routes - 개인정보 처리방침 준비 후 활성화 예정
  /*
  app.get("/auth/google", passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  }));
  
  app.get("/auth/google/callback", 
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    (req, res) => {
      res.redirect('/'); // Redirect to main app after successful login
    }
  );
  */
  
  // Logout
  app.post("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "로그아웃에 실패했습니다." });
      }
      res.json({ message: "로그아웃되었습니다." });
    });
  });
  
  // Get current user - 임시로 더미 사용자 반환
  app.get("/auth/user", (req, res) => {
    // 임시로 더미 사용자 정보 반환 (인증 우회)
    res.json({
      id: 1,
      email: "guest@blogcheatkey.com",
      name: "게스트 사용자",
      profileImage: null
    });
    
    // 원래 코드 (나중에 활성화)
    /*
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        profileImage: user.profileImage 
      });
    } else {
      res.status(401).json({ error: "인증되지 않은 사용자입니다." });
    }
    */
  });

  // ===== SOCIAL LOGIN ROUTES =====
  
  // Google OAuth routes - 개인정보 처리방침 준비 후 활성화 예정
  /*
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      successRedirect: '/',
      failureRedirect: '/login?error=google_login_failed'
    })
  );
  */

  // Kakao OAuth routes - 소셜 로그인 기능 일시 비활성화
  /*
  app.get('/auth/kakao',
    passport.authenticate('kakao')
  );

  app.get('/auth/kakao/callback',
    passport.authenticate('kakao', { 
      successRedirect: '/',
      failureRedirect: '/login?error=kakao_login_failed'
    })
  );
  */

  // Naver OAuth routes - 소셜 로그인 기능 일시 비활성화
  /*
  app.get('/auth/naver',
    passport.authenticate('naver')
  );

  app.get('/auth/naver/callback',
    passport.authenticate('naver', { 
      successRedirect: '/',
      failureRedirect: '/login?error=naver_login_failed'
    })
  );
  */
  
  // ===== PROTECTED ROUTES (require authentication) =====
  
  // Create new blog project
  app.post("/api/projects", async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ error: "키워드를 입력해주세요" });
      }

      // 인증 우회: 기본 사용자 ID 사용
      const project = await storage.createBlogProject({
        keyword,
        status: "keyword_analysis",
        keywordAnalysis: null,
        subtitles: null,
        researchData: null,
        businessInfo: null,
        generatedContent: null,
        seoMetrics: null,
        referenceLinks: null,
      });

      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ error: "프로젝트 생성에 실패했습니다" });
    }
  });

  // Get project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      res.json(project);
    } catch (error) {
      console.error("Project fetch error:", error);
      res.status(500).json({ error: "프로젝트 조회에 실패했습니다" });
    }
  });

  // Analyze keyword with Gemini
  app.post("/api/projects/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      const analysis = await analyzeKeyword(project.keyword);
      
      const updatedProject = await storage.updateBlogProject(id, {
        keywordAnalysis: analysis,
        subtitles: analysis.suggestedSubtitles,
        status: "keyword_analysis",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Keyword analysis error:", error);
      res.status(500).json({ error: "키워드 분석에 실패했습니다" });
    }
  });

  // Update subtitles
  app.post("/api/projects/:id/subtitles", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { subtitles } = req.body;
      
      if (!Array.isArray(subtitles) || subtitles.length !== 4) {
        return res.status(400).json({ error: "4개의 소제목을 입력해주세요" });
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

  // Research with Perplexity
  app.post("/api/projects/:id/research", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project || !project.subtitles) {
        return res.status(400).json({ error: "소제목이 설정되지 않았습니다" });
      }

      const research = await searchResearch(project.keyword, project.subtitles as string[]);
      
      const updatedProject = await storage.updateBlogProject(id, {
        researchData: research,
        referenceLinks: research.citations,
        status: "business_info",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Research error:", error);
      res.status(500).json({ error: "자료 수집에 실패했습니다" });
    }
  });

  // Save business info
  app.post("/api/projects/:id/business", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessInfo = businessInfoSchema.parse(req.body);
      
      // Only save business info, don't change status to prevent auto-generation
      const updatedProject = await storage.updateBlogProject(id, {
        businessInfo,
        // Keep current status, don't auto-change to content_generation
      });

      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Business info save error:", error);
      res.status(500).json({ error: "업체 정보 저장에 실패했습니다" });
    }
  });

  // Generate blog content
  app.post("/api/projects/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project || !project.subtitles || !project.researchData || !project.businessInfo) {
        return res.status(400).json({ error: "필요한 정보가 모두 준비되지 않았습니다" });
      }

      // Update status to content_generation when actually starting generation
      await storage.updateBlogProject(id, {
        status: "content_generation",
      });

      // Generate content with strict morpheme requirements
      const { generateStrictMorphemeContent } = await import('./services/strictMorphemeGenerator');
      
      const generationResult = await generateStrictMorphemeContent(
        project.keyword,
        project.subtitles as string[],
        project.researchData as any,
        project.businessInfo as any,
        project.referenceBlogLinks as any,
        project.customMorphemes as string | undefined
      );
      
      let finalContent = generationResult.content;
      let seoAnalysis = generationResult.analysis;
      
      console.log(`Content generation completed in ${generationResult.attempts} attempts. Success: ${generationResult.success}`);
      
      // Enhanced optimization process with multiple stages
      console.log('Starting multi-stage optimization process');
      
      // Stage 1: Initial content optimization
      if (!generationResult.success) {
        try {
          console.log('Stage 1: Initial content optimization');
          const { optimizeMorphemeUsage } = await import('./services/morphemeOptimizer');
          const optimizedContent = await optimizeMorphemeUsage(
            finalContent,
            project.keyword,
            project.businessInfo as any
          );
          
          // Re-analyze optimized content
          const { analyzeMorphemes } = await import('./services/morphemeAnalyzer');
          const optimizedAnalysis = analyzeMorphemes(optimizedContent.optimizedContent, project.keyword);
          
          if (optimizedAnalysis.isOptimized) {
            console.log('Stage 1 successful: Content meets morpheme conditions');
            finalContent = optimizedContent.optimizedContent;
            seoAnalysis = optimizedAnalysis;
          }
        } catch (optimizationError) {
          console.error("Stage 1 optimization failed:", optimizationError);
        }
      }
      
      // Stage 2: Introduction/conclusion enhancement (only if content is already optimized)
      if (generationResult.success || seoAnalysis.isOptimized) {
        try {
          console.log('Stage 2: Introduction/conclusion enhancement');
          const enhancedContent = await enhanceIntroductionAndConclusion(
            finalContent,
            project.keyword,
            project.businessInfo as any
          );
          
          // Check if enhancement broke morpheme conditions
          const { analyzeMorphemes } = await import('./services/morphemeAnalyzer');
          const enhancedAnalysis = analyzeMorphemes(enhancedContent, project.keyword);
          
          if (enhancedAnalysis.isOptimized) {
            console.log('Stage 2 successful: Enhancement maintains morpheme conditions');
            finalContent = enhancedContent;
            seoAnalysis = enhancedAnalysis;
          } else {
            console.log('Stage 2 failed: Enhancement broke morpheme conditions, reverting');
          }
        } catch (enhancementError) {
          console.error("Stage 2 enhancement failed:", enhancementError);
        }
      } else {
        console.log('Stage 2 skipped: Content not optimized enough for enhancement');
      }

      // Don't auto-generate images, only generate content
      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: finalContent,
        seoMetrics: seoAnalysis,
        status: "completed",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ error: "블로그 생성에 실패했습니다" });
    }
  });

  // Regenerate blog content
  app.post("/api/projects/:id/regenerate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBlogProject(id);
      
      if (!project || !project.subtitles || !project.researchData || !project.businessInfo) {
        return res.status(400).json({ error: "필요한 정보가 모두 준비되지 않았습니다" });
      }

      // Update status to content_generation
      await storage.updateBlogProject(id, {
        status: "content_generation",
      });

      // Regenerate content with strict morpheme requirements
      const { regenerateWithStrictMorphemes } = await import('./services/strictMorphemeGenerator');
      
      const regenerationResult = await regenerateWithStrictMorphemes(
        project.generatedContent || '',
        project.keyword,
        project.subtitles as string[],
        project.researchData as any,
        project.businessInfo as any,
        project.customMorphemes as string | undefined
      );
      
      const finalContent = regenerationResult.content;
      const seoAnalysis = regenerationResult.analysis;
      
      console.log(`Content regeneration completed in ${regenerationResult.attempts} attempts. Success: ${regenerationResult.success}`);

      // Update project with regenerated content
      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: finalContent,
        seoMetrics: seoAnalysis,
        status: "completed",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Content regeneration error:", error);
      res.status(500).json({ error: "블로그 재생성에 실패했습니다" });
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

      const content = format === 'mobile' 
        ? formatForMobile(project.generatedContent)
        : project.generatedContent;

      res.json({ content });
    } catch (error) {
      console.error("Copy content error:", error);
      res.status(500).json({ error: "콘텐츠 복사에 실패했습니다" });
    }
  });

  // Update reference blog links
  app.post("/api/projects/:id/reference-links", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { links } = req.body;
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      await storage.updateBlogProject(id, {
        referenceBlogLinks: links
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Reference links update error:", error);
      res.status(500).json({ error: "참고 링크 저장에 실패했습니다" });
    }
  });

  // Update custom morphemes
  app.post("/api/projects/:id/custom-morphemes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { customMorphemes } = req.body;
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      await storage.updateBlogProject(id, {
        customMorphemes
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Custom morphemes update error:", error);
      res.status(500).json({ error: "사용자 정의 형태소 저장에 실패했습니다" });
    }
  });

  // Simple rate limiting for image generation
  const imageGenerationRateLimit = new Map<string, number>();
  
  // Chat with Gemini for editing and image generation
  app.post("/api/projects/:id/chat", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "메시지를 입력해주세요" });
      }

      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      // Save user message
      await storage.createChatMessage({
        projectId: id,
        role: "user",
        content: message,
      });

      // Check if user is requesting title generation
      const titleKeywords = ['제목', '타이틀', 'title', '제목 만들어', '제목 생성', '제목 추천'];
      const isTitleRequest = titleKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      // More precise image generation detection
      const imageKeywords = ['그림', '이미지', '그려줘', '만들어줘', '생성해줘', 'image', 'draw', 'create', '사진', '인포그래픽'];
      const contentEditKeywords = ['수정', '바꿔', '고쳐', '바꿔줘', '고쳐줘', '서론', '결론', '내용', '문단', '문장', '단어'];
      
      // If message contains content editing keywords, prioritize content editing over image generation
      const isContentEdit = contentEditKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Only treat as image request if it has image keywords AND no content editing keywords
      const isImageRequest = !isTitleRequest && !isContentEdit && imageKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isTitleRequest) {
        // Title generation
        if (!project.generatedContent) {
          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: "제목을 생성하려면 먼저 블로그 콘텐츠를 생성해주세요.",
          });
          return res.json({ success: true, type: 'error' });
        }

        try {
          const titleGenerator = new TitleGenerator();
          const titles = await titleGenerator.generateTitles(project.keyword, project.generatedContent);
          
          // Format titles for display
          let titleResponse = "📝 **10가지 유형별 제목 추천**\n\n";
          
          const typeNames = {
            general: '🎯 일반 상식 반박형',
            approval: '👑 인정욕구 자극형',
            secret: '🔒 숨겨진 비밀형',
            trend: '📈 트렌드 제시형',
            failure: '❌ 실패담 공유형',
            comparison: '⚖️ 비교형',
            warning: '⚠️ 경고형',
            blame: '🤝 남탓 공감형',
            beginner: '🔰 초보자 가이드형',
            benefit: '✨ 효과 제시형'
          };

          for (const [type, typeName] of Object.entries(typeNames)) {
            titleResponse += `${typeName}\n`;
            if (titles[type] && titles[type].length > 0) {
              titles[type].forEach((title: string, index: number) => {
                titleResponse += `${index + 1}. ${title}\n`;
              });
            }
            titleResponse += "\n";
          }

          titleResponse += "💡 원하는 제목을 복사해서 사용하시거나,\n특정 스타일로 더 만들어달라고 요청해주세요!";

          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: titleResponse,
          });

          res.json({ 
            success: true, 
            type: 'title',
            titles: titles,
            message: titleResponse
          });
        } catch (titleError) {
          console.error("Title generation error:", titleError);
          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: "죄송합니다. 제목 생성에 실패했습니다. 다시 시도해주세요.",
          });
          res.json({ success: true, type: 'error' });
        }
      } else if (isImageRequest) {
        // Rate limiting for image generation (1 request per 30 seconds per project)
        const rateLimitKey = `image_${id}`;
        const lastRequest = imageGenerationRateLimit.get(rateLimitKey);
        const now = Date.now();
        
        if (lastRequest && (now - lastRequest) < 30000) {
          const remainingTime = Math.ceil((30000 - (now - lastRequest)) / 1000);
          return res.json({
            success: true,
            type: 'rate_limit',
            message: `이미지 생성은 30초마다 1회만 가능합니다. ${remainingTime}초 후 다시 시도해주세요.`
          });
        }
        
        imageGenerationRateLimit.set(rateLimitKey, now);
        
        try {
          // Enhanced image prompt extraction
          let cleanPrompt = message;
          
          // Remove common request phrases but preserve the core content
          cleanPrompt = cleanPrompt
            // Remove leading image request words
            .replace(/^(그림을?\s*|이미지를?\s*|사진을?\s*)/gi, '')
            // Remove trailing action words first
            .replace(/\s*(그려|만들어|생성해?|해봐?)(줘|주세요|라)?\s*$/gi, '')
            // Remove middle action words
            .replace(/\s*(그려|만들어|생성해?|해봐?)?(줘|주세요|라)\s*/gi, '')
            // Remove English equivalents
            .replace(/\s*(image|draw|create|generate)\s*/gi, '')
            // Remove remaining "그림을" patterns
            .replace(/\s*그림을?\s*/gi, ' ')
            // Remove remaining "이미지를" patterns
            .replace(/\s*이미지를?\s*/gi, ' ')
            // Remove remaining "사진을" patterns
            .replace(/\s*사진을?\s*/gi, ' ')
            // Remove "에 대한" patterns
            .replace(/\s*에 대한\s*/gi, ' ')
            // Remove Korean particles at the end (multiple passes to ensure removal)
            .replace(/을$/gi, '')
            .replace(/를$/gi, '')
            .replace(/이$/gi, '')
            .replace(/가$/gi, '')
            .replace(/는$/gi, '')
            .replace(/은$/gi, '')
            .replace(/의$/gi, '')
            .replace(/을$/gi, '')
            .replace(/를$/gi, '')
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            .trim();

          // If prompt is empty or too short, use keyword as fallback
          if (!cleanPrompt || cleanPrompt.length < 2) {
            cleanPrompt = project.keyword;
          }

          // Determine style based on request keywords
          let style = 'photo'; // default to photo
          
          if (message.includes('인포그래픽') || message.includes('infographic')) {
            style = 'infographic';
          } else if (message.includes('설명') || message.includes('도표') || message.includes('차트') || message.includes('그래프')) {
            style = 'infographic';
          } else if (message.includes('사진') || message.includes('photo') || message.includes('이미지')) {
            style = 'photo';
          } else if (message.includes('그림') || message.includes('draw') || message.includes('illustration')) {
            style = 'photo';
          }

          console.log(`Original message: "${message}"`);
          console.log(`Cleaned prompt: "${cleanPrompt}"`);
          console.log(`Style: ${style}`);

          const imageUrl = await generateImage(cleanPrompt, style);

          // Save AI response with image
          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: `"${cleanPrompt}"에 대한 ${style === 'infographic' ? '인포그래픽' : '이미지'}를 생성했습니다.`,
            imageUrl: imageUrl,
          });

          res.json({ 
            success: true, 
            type: 'image',
            imageUrl: imageUrl,
            prompt: cleanPrompt
          });
        } catch (imageError) {
          console.error("Image generation error:", imageError);
          await storage.createChatMessage({
            projectId: id,
            role: "assistant",
            content: "죄송합니다. 이미지 생성에 실패했습니다. 다시 시도해주세요.",
          });
          res.json({ success: true, type: 'error' });
        }
      } else {
        // Regular content editing
        if (!project.generatedContent) {
          return res.status(404).json({ error: "편집할 콘텐츠가 없습니다" });
        }

        // Get edited content from Gemini with SEO validation
        const { editContent } = await import("./services/gemini.js");
        const editedContent = await editContent(
          project.generatedContent,
          message,
          project.keyword,
          project.customMorphemes || undefined
        );

        // Analyze morphemes to ensure SEO conditions are met
        const { analyzeMorphemes } = await import("./services/morphemeAnalyzer.js");
        const morphemeAnalysis = analyzeMorphemes(editedContent, project.keyword, project.customMorphemes || undefined);
        
        let responseMessage = "콘텐츠가 수정되었습니다.";
        if (!morphemeAnalysis.isOptimized) {
          responseMessage += `\n\n⚠️ SEO 최적화 상태:\n${morphemeAnalysis.issues.join('\n')}`;
        } else {
          responseMessage += "\n\n✅ SEO 최적화 조건을 만족합니다.";
        }

        // Save assistant message
        await storage.createChatMessage({
          projectId: id,
          role: "assistant",
          content: responseMessage,
        });

        // Update project with edited content
        const seoAnalysis = await analyzeSEOOptimization(editedContent, project.keyword);
        const updatedProject = await storage.updateBlogProject(id, {
          generatedContent: editedContent,
          seoMetrics: seoAnalysis,
        });

        res.json({ success: true, type: 'edit', project: updatedProject });
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

  // Download image
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
      
      // Fetch the image from the URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(404).json({ error: "이미지 다운로드에 실패했습니다" });
      }

      const imageBuffer = await response.arrayBuffer();
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="infographic-${project.keyword}-${imageIndex + 1}.png"`);
      res.send(Buffer.from(imageBuffer));
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ error: "이미지 다운로드에 실패했습니다" });
    }
  });

  // Get user business info
  app.get("/api/user/business-info", async (req, res) => {
    try {
      const userId = 1; // 인증 우회: 기본 사용자 ID 사용
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
      const userId = 1; // 인증 우회: 기본 사용자 ID 사용
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
      const userId = 1; // 인증 우회: 기본 사용자 ID 사용
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
      const success = await storage.deleteUserBusinessInfo(id);
      res.json({ success });
    } catch (error) {
      console.error("Delete business info error:", error);
      res.status(500).json({ error: "업체 정보 삭제에 실패했습니다" });
    }
  });

  // Generate individual image for subtitle
  app.post("/api/projects/:id/generate-image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { subtitle, type } = req.body; // type: 'infographic' or 'photo'
      
      const project = await storage.getBlogProject(id);
      if (!project) {
        return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다" });
      }

      let imageUrl;
      if (type === 'infographic') {
        const { generateInfographic } = await import("./services/imageGeneration.js");
        imageUrl = await generateInfographic(subtitle, project.keyword);
      } else {
        // Generate photo-style image focused on subtitle content, not keyword
        const { generateImage } = await import("./services/imageGeneration.js");
        imageUrl = await generateImage(subtitle, "photo");
      }

      res.json({ imageUrl, subtitle, type });
    } catch (error) {
      console.error("Individual image generation error:", error);
      // Check if it's a permission error
      if (error instanceof Error && error.message.includes('Permission')) {
        res.status(503).json({ 
          error: 'Google Cloud 권한 설정이 필요합니다', 
          details: 'Vertex AI User 역할을 서비스 계정에 추가해주세요'
        });
      } else {
        res.status(500).json({ error: "이미지 생성에 실패했습니다" });
      }
    }
  });

  // Download individual image
  app.get("/api/projects/:id/download-image", async (req, res) => {
    try {
      const { imageUrl, filename } = req.query;
      
      if (!imageUrl || !filename) {
        return res.status(400).json({ error: "이미지 URL과 파일명이 필요합니다" });
      }

      const response = await fetch(imageUrl as string);
      if (!response.ok) {
        throw new Error("이미지 다운로드 실패");
      }

      const buffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Image download error:", error);
      res.status(500).json({ error: "이미지 다운로드에 실패했습니다" });
    }
  });

  // ===== 결제 관련 라우터 =====
  
  // 구독 결제 준비
  app.post("/api/payment/prepare", async (req, res) => {
    try {
      const { amount, name, planType } = req.body;
      
      if (!amount || !name || !planType) {
        return res.status(400).json({ error: "필수 정보가 누락되었습니다." });
      }

      const paymentData = preparePayment({
        merchant_uid: `subscription_${Date.now()}`,
        amount: Number(amount),
        name: String(name),
        planType: String(planType),
      });

      res.json(paymentData);
    } catch (error) {
      console.error("Subscription preparation error:", error);
      res.status(500).json({ error: "구독 준비 중 오류가 발생했습니다." });
    }
  });

  // 구독 결제 검증
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { imp_uid, merchant_uid } = req.body;
      
      if (!imp_uid || !merchant_uid) {
        return res.status(400).json({ error: "결제 정보가 누락되었습니다." });
      }

      const verificationResult = await verifyPayment({ imp_uid, merchant_uid });
      
      if (verificationResult.success) {
        // 구독 정보 저장 로직 구현 예정
        // - 사용자 구독 플랜 업데이트
        // - 구독 시작일/만료일 설정
        // - 월별 사용량 제한 초기화
        
        res.json({ 
          success: true, 
          payment: verificationResult.payment,
          subscription: {
            plan: merchant_uid.includes('content_only') ? 'basic' :
                  merchant_uid.includes('content_and_images') ? 'premium' : 'pro',
            startDate: new Date(),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
          }
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: verificationResult.error 
        });
      }
    } catch (error) {
      console.error("Subscription verification error:", error);
      res.status(500).json({ error: "구독 검증 중 오류가 발생했습니다." });
    }
  });

  // 결제 취소
  app.post("/api/payment/cancel", async (req, res) => {
    try {
      const { imp_uid, reason } = req.body;
      
      if (!imp_uid) {
        return res.status(400).json({ error: "결제 ID가 누락되었습니다." });
      }

      const cancelResult = await cancelPayment(imp_uid, reason);
      
      if (cancelResult.success) {
        res.json({ success: true, data: cancelResult.data });
      } else {
        res.status(400).json({ success: false, error: cancelResult.error });
      }
    } catch (error) {
      console.error("Payment cancellation error:", error);
      res.status(500).json({ error: "결제 취소 중 오류가 발생했습니다." });
    }
  });

  // 결제 내역 조회
  app.get("/api/payment/history", async (req, res) => {
    try {
      const historyResult = await getPaymentHistory();
      
      if (historyResult.success) {
        res.json({ success: true, payments: historyResult.payments });
      } else {
        res.status(500).json({ success: false, error: historyResult.error });
      }
    } catch (error) {
      console.error("Payment history error:", error);
      res.status(500).json({ error: "결제 내역 조회 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
