import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { businessInfoSchema, keywordAnalysisSchema, seoMetricsSchema } from "@shared/schema";
import { analyzeKeyword, editContent } from "./services/gemini";
import { writeOptimizedBlogPost } from "./services/anthropic";
import { searchResearch, getDetailedResearch } from "./services/perplexity";
import { generateMultipleImages } from "./services/imageGeneration";
import { analyzeSEOOptimization, formatForMobile } from "./services/seoOptimizer";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new blog project
  app.post("/api/projects", async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ error: "키워드를 입력해주세요" });
      }

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
        status: "data_collection",
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
      
      const updatedProject = await storage.updateBlogProject(id, {
        businessInfo,
        status: "content_generation",
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

      // Generate content with Claude
      const content = await writeOptimizedBlogPost(
        project.keyword,
        project.subtitles as string[],
        project.researchData as any,
        project.businessInfo as any
      );

      // Analyze SEO optimization
      const seoAnalysis = await analyzeSEOOptimization(content, project.keyword);

      // If not optimized, try once more
      let finalContent = content;
      if (!seoAnalysis.isOptimized) {
        finalContent = await writeOptimizedBlogPost(
          project.keyword,
          project.subtitles as string[],
          project.researchData as any,
          project.businessInfo as any,
          seoAnalysis.suggestions
        );
      }

      // Generate images for each subtitle
      const images = await generateMultipleImages(project.subtitles as string[], project.keyword);

      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: finalContent,
        seoMetrics: seoAnalysis,
        generatedImages: images,
        status: "completed",
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ error: "블로그 생성에 실패했습니다" });
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

  // Chat with Gemini for editing
  app.post("/api/projects/:id/chat", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { message } = req.body;
      
      const project = await storage.getBlogProject(id);
      if (!project || !project.generatedContent) {
        return res.status(404).json({ error: "수정할 콘텐츠를 찾을 수 없습니다" });
      }

      // Save user message
      await storage.createChatMessage({
        projectId: id,
        role: "user",
        content: message,
      });

      // Get edited content from Gemini
      const editedContent = await editContent(
        project.generatedContent,
        message,
        project.keyword
      );

      // Save assistant message
      await storage.createChatMessage({
        projectId: id,
        role: "assistant",
        content: "콘텐츠가 수정되었습니다.",
      });

      // Update project with edited content
      const seoAnalysis = await analyzeSEOOptimization(editedContent, project.keyword);
      const updatedProject = await storage.updateBlogProject(id, {
        generatedContent: editedContent,
        seoMetrics: seoAnalysis,
      });

      res.json(updatedProject);
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
      const userId = 1; // Default user for demo
      const businessInfo = await storage.getUserBusinessInfo(userId);
      res.json(businessInfo);
    } catch (error) {
      console.error("Get business info error:", error);
      res.status(500).json({ error: "업체 정보 조회에 실패했습니다" });
    }
  });

  // Create or update user business info
  app.post("/api/user/business-info", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const businessInfoData = businessInfoSchema.parse(req.body);
      
      const existingInfo = await storage.getUserBusinessInfo(userId);
      
      let businessInfo;
      if (existingInfo) {
        businessInfo = await storage.updateUserBusinessInfo(userId, {
          ...businessInfoData,
          userId,
        });
      } else {
        businessInfo = await storage.createUserBusinessInfo({
          ...businessInfoData,
          userId,
        });
      }
      
      res.json(businessInfo);
    } catch (error) {
      console.error("Save business info error:", error);
      res.status(500).json({ error: "업체 정보 저장에 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
