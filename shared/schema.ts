import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userBusinessInfo = pgTable("user_business_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  expertise: text("expertise").notNull(),
  differentiators: text("differentiators").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogProjects = pgTable("blog_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  keyword: text("keyword").notNull(),
  status: text("status").notNull().default("keyword_analysis"), // keyword_analysis, data_collection, business_info, content_generation, completed
  keywordAnalysis: jsonb("keyword_analysis"),
  subtitles: jsonb("subtitles"),
  researchData: jsonb("research_data"),
  businessInfo: jsonb("business_info"),
  generatedContent: text("generated_content"),
  seoMetrics: jsonb("seo_metrics"),
  referenceLinks: jsonb("reference_links"),
  generatedImages: jsonb("generated_images"), // Array of image URLs
  referenceBlogLinks: jsonb("reference_blog_links"), // Array of reference blog URLs for tone/style
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => blogProjects.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBlogProjectSchema = createInsertSchema(blogProjects).pick({
  keyword: true,
  status: true,
  keywordAnalysis: true,
  subtitles: true,
  researchData: true,
  businessInfo: true,
  generatedContent: true,
  seoMetrics: true,
  referenceLinks: true,
  generatedImages: true,
  referenceBlogLinks: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  projectId: true,
  role: true,
  content: true,
  imageUrl: true,
});

export const insertUserBusinessInfoSchema = createInsertSchema(userBusinessInfo).pick({
  userId: true,
  businessName: true,
  businessType: true,
  expertise: true,
  differentiators: true,
});

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, "업체명을 입력해주세요"),
  businessType: z.string().min(1, "업종을 선택해주세요"),
  expertise: z.string().min(1, "전문성을 입력해주세요"),
  differentiators: z.string().min(1, "차별점을 입력해주세요"),
});

export const keywordAnalysisSchema = z.object({
  searchIntent: z.string(),
  userConcerns: z.string(),
  suggestedSubtitles: z.array(z.string()),
});

export const seoMetricsSchema = z.object({
  keywordFrequency: z.number(),
  characterCount: z.number(),
  isOptimized: z.boolean(),
  morphemeCount: z.number(),
});

export const referenceBlogLinkSchema = z.object({
  url: z.string().url("올바른 URL을 입력해주세요"),
  purpose: z.enum(["tone", "storytelling", "hook", "cta"]),
  description: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserBusinessInfo = z.infer<typeof insertUserBusinessInfoSchema>;
export type UserBusinessInfo = typeof userBusinessInfo.$inferSelect;
export type InsertBlogProject = z.infer<typeof insertBlogProjectSchema>;
export type BlogProject = typeof blogProjects.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
export type SEOMetrics = z.infer<typeof seoMetricsSchema>;
export type ReferenceBlogLink = z.infer<typeof referenceBlogLinkSchema>;
