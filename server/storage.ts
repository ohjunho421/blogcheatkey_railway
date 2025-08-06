import { users, userBusinessInfo, blogProjects, chatMessages, type User, type InsertUser, type UserBusinessInfo, type InsertUserBusinessInfo, type BlogProject, type InsertBlogProject, type ChatMessage, type InsertChatMessage, type UpdateUserPermissions } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySocialId(provider: 'google' | 'kakao' | 'naver', socialId: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(userData: Partial<InsertUser>): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // User business info methods
  getUserBusinessInfo(userId: number): Promise<UserBusinessInfo | undefined>;
  createUserBusinessInfo(businessInfo: InsertUserBusinessInfo): Promise<UserBusinessInfo>;
  updateUserBusinessInfo(userId: number, updates: Partial<InsertUserBusinessInfo>): Promise<UserBusinessInfo>;
  updateUserBusinessInfoById(id: number, updates: Partial<InsertUserBusinessInfo>): Promise<UserBusinessInfo>;
  getAllUserBusinessInfos(userId: number): Promise<UserBusinessInfo[]>;
  deleteUserBusinessInfo(id: number): Promise<boolean>;
  
  // Blog project methods
  createBlogProject(project: InsertBlogProject): Promise<BlogProject>;
  getBlogProject(id: number): Promise<BlogProject | undefined>;
  updateBlogProject(id: number, updates: Partial<InsertBlogProject>): Promise<BlogProject>;
  getBlogProjectsByUser(userId: number): Promise<BlogProject[]>;
  deleteBlogProject(id: number): Promise<boolean>;
  
  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(projectId: number): Promise<ChatMessage[]>;
  deleteChatMessages(projectId: number): Promise<boolean>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateUserPermissions(userId: number, permissions: UpdateUserPermissions): Promise<User>;
  makeUserAdmin(email: string): Promise<User | null>;
  
  // Authentication methods
  loginUser(email: string, password: string): Promise<User | null>;
  getUserById(id: number): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserBySocialId(provider: 'google' | 'kakao' | 'naver', socialId: string): Promise<User | undefined> {
    const column = provider === 'google' ? users.googleId : 
                   provider === 'kakao' ? users.kakaoId : 
                   users.naverId;
    const [user] = await db.select().from(users).where(eq(column, socialId));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserBusinessInfo(userId: number): Promise<UserBusinessInfo | undefined> {
    const [businessInfo] = await db.select().from(userBusinessInfo).where(eq(userBusinessInfo.userId, userId));
    return businessInfo || undefined;
  }

  async getAllUserBusinessInfos(userId: number): Promise<UserBusinessInfo[]> {
    const businessInfos = await db.select().from(userBusinessInfo).where(eq(userBusinessInfo.userId, userId));
    return businessInfos;
  }

  async createUserBusinessInfo(insertBusinessInfo: InsertUserBusinessInfo): Promise<UserBusinessInfo> {
    const [businessInfo] = await db
      .insert(userBusinessInfo)
      .values(insertBusinessInfo)
      .returning();
    return businessInfo;
  }

  async updateUserBusinessInfo(userId: number, updates: Partial<InsertUserBusinessInfo>): Promise<UserBusinessInfo> {
    const [updated] = await db
      .update(userBusinessInfo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userBusinessInfo.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error(`Business info for user ${userId} not found`);
    }
    
    return updated;
  }

  async updateUserBusinessInfoById(id: number, updates: Partial<InsertUserBusinessInfo>): Promise<UserBusinessInfo> {
    const [updated] = await db
      .update(userBusinessInfo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userBusinessInfo.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Business info with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteUserBusinessInfo(id: number): Promise<boolean> {
    const result = await db.delete(userBusinessInfo).where(eq(userBusinessInfo.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createBlogProject(insertProject: InsertBlogProject): Promise<BlogProject> {
    const [project] = await db
      .insert(blogProjects)
      .values({
        ...insertProject,
        status: insertProject.status || 'keyword_analysis',
      })
      .returning();
    return project;
  }

  async getBlogProject(id: number): Promise<BlogProject | undefined> {
    const [project] = await db.select().from(blogProjects).where(eq(blogProjects.id, id));
    return project || undefined;
  }

  async updateBlogProject(id: number, updates: Partial<InsertBlogProject>): Promise<BlogProject> {
    const [updated] = await db
      .update(blogProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogProjects.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Blog project with id ${id} not found`);
    }
    
    return updated;
  }

  async getBlogProjectsByUser(userId: number): Promise<BlogProject[]> {
    return await db.select().from(blogProjects).where(eq(blogProjects.userId, userId));
  }

  async deleteBlogProject(id: number): Promise<boolean> {
    const result = await db.delete(blogProjects).where(eq(blogProjects.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(projectId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(chatMessages.createdAt);
  }

  async deleteChatMessages(projectId: number): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.projectId, projectId));
    return (result.rowCount || 0) > 0;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserPermissions(userId: number, permissions: UpdateUserPermissions): Promise<User> {
    const updateData: any = { ...permissions, updatedAt: new Date() };
    
    // Convert subscriptionExpiresAt string to Date if provided
    if (permissions.subscriptionExpiresAt) {
      updateData.subscriptionExpiresAt = new Date(permissions.subscriptionExpiresAt);
    }
    
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updated) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return updated;
  }

  async makeUserAdmin(email: string): Promise<User | null> {
    const [updated] = await db
      .update(users)
      .set({ 
        isAdmin: true,
        canGenerateContent: true,
        canGenerateImages: true,
        canUseChatbot: true,
        subscriptionTier: "premium",
        updatedAt: new Date() 
      })
      .where(eq(users.email, email))
      .returning();
    
    return updated || null;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.password) {
        return null;
      }

      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("Login user error:", error);
      return null;
    }
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
}

export const storage = new DatabaseStorage();
