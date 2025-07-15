import { users, userBusinessInfo, blogProjects, chatMessages, type User, type InsertUser, type UserBusinessInfo, type InsertUserBusinessInfo, type BlogProject, type InsertBlogProject, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User business info methods
  getUserBusinessInfo(userId: number): Promise<UserBusinessInfo | undefined>;
  createUserBusinessInfo(businessInfo: InsertUserBusinessInfo): Promise<UserBusinessInfo>;
  updateUserBusinessInfo(userId: number, updates: Partial<InsertUserBusinessInfo>): Promise<UserBusinessInfo>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserBusinessInfo(userId: number): Promise<UserBusinessInfo | undefined> {
    const [businessInfo] = await db.select().from(userBusinessInfo).where(eq(userBusinessInfo.userId, userId));
    return businessInfo || undefined;
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

  async createBlogProject(insertProject: InsertBlogProject): Promise<BlogProject> {
    // Ensure default user exists
    let defaultUser = await this.getUser(1);
    if (!defaultUser) {
      defaultUser = await this.createUser({
        username: 'demo_user',
        password: 'demo_password'
      });
    }

    const [project] = await db
      .insert(blogProjects)
      .values({
        ...insertProject,
        userId: defaultUser.id,
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
}

export const storage = new DatabaseStorage();
