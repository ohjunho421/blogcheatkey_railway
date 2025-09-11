import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with social login support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password"), // null for social login users
  name: text("name"),
  profileImage: text("profile_image"),
  // Social login fields
  googleId: text("google_id").unique(),
  kakaoId: text("kakao_id").unique(),
  naverId: text("naver_id").unique(),
  // Account status
  isEmailVerified: boolean("is_email_verified").default(false),
  isActive: boolean("is_active").default(true),
  // Admin and subscription fields
  isAdmin: boolean("is_admin").default(false),
  subscriptionTier: text("subscription_tier").default("basic"), // basic, premium
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  paymentDate: timestamp("payment_date"), // 입금일 - 한달 후 자동 만료 계산용
  // Feature permissions (can be individually granted by admin)
  canGenerateContent: boolean("can_generate_content").default(false),
  canGenerateImages: boolean("can_generate_images").default(false),
  canUseChatbot: boolean("can_use_chatbot").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

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
  customMorphemes: text("custom_morphemes"), // User-defined morphemes separated by spaces
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

// Completed projects for history page
export const completedProjects = pgTable("completed_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title"), // Blog post title
  keyword: text("keyword").notNull(),
  content: text("content").notNull(),
  referenceData: jsonb("reference_data"), // Research sources and references
  seoMetrics: jsonb("seo_metrics"), // SEO analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Email login schema
export const emailSignupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
});

export const emailLoginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// Social login user creation
export const socialUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string(),
  profileImage: z.string().optional(),
  googleId: z.string().optional(),
  kakaoId: z.string().optional(),
  naverId: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users);

export const insertBlogProjectSchema = createInsertSchema(blogProjects).pick({
  userId: true,
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
  customMorphemes: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  projectId: true,
  role: true,
  content: true,
  imageUrl: true,
});

export const insertCompletedProjectSchema = createInsertSchema(completedProjects).pick({
  userId: true,
  title: true,
  keyword: true,
  content: true,
  referenceData: true,
  seoMetrics: true,
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

// Admin schemas
export const updateUserPermissionsSchema = z.object({
  isAdmin: z.boolean().optional(),
  subscriptionTier: z.enum(["basic", "premium"]).optional(),
  subscriptionExpiresAt: z.string().datetime().optional().nullable(),
  paymentDate: z.string().datetime().optional().nullable(),
  canGenerateContent: z.boolean().optional(),
  canGenerateImages: z.boolean().optional(),
  canUseChatbot: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EmailSignup = z.infer<typeof emailSignupSchema>;
export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type SocialUser = z.infer<typeof socialUserSchema>;
export type InsertUserBusinessInfo = z.infer<typeof insertUserBusinessInfoSchema>;
export type UserBusinessInfo = typeof userBusinessInfo.$inferSelect;
export type InsertBlogProject = z.infer<typeof insertBlogProjectSchema>;
export type BlogProject = typeof blogProjects.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCompletedProject = z.infer<typeof insertCompletedProjectSchema>;
export type CompletedProject = typeof completedProjects.$inferSelect;
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
export type SEOMetrics = z.infer<typeof seoMetricsSchema>;
export type ReferenceBlogLink = z.infer<typeof referenceBlogLinkSchema>;
export type UpdateUserPermissions = z.infer<typeof updateUserPermissionsSchema>;
