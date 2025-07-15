import { users, blogProjects, chatMessages, type User, type InsertUser, type BlogProject, type InsertBlogProject, type ChatMessage, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blogProjects: Map<number, BlogProject>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.blogProjects = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBlogProject(insertProject: InsertBlogProject): Promise<BlogProject> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: BlogProject = {
      ...insertProject,
      id,
      userId: 1, // Default user for demo
      status: insertProject.status || 'keyword_analysis',
      keywordAnalysis: insertProject.keywordAnalysis || null,
      subtitles: insertProject.subtitles || null,
      researchData: insertProject.researchData || null,
      businessInfo: insertProject.businessInfo || null,
      generatedContent: insertProject.generatedContent || null,
      seoMetrics: insertProject.seoMetrics || null,
      referenceLinks: insertProject.referenceLinks || null,
      generatedImages: insertProject.generatedImages || null,
      createdAt: now,
      updatedAt: now,
    };
    this.blogProjects.set(id, project);
    return project;
  }

  async getBlogProject(id: number): Promise<BlogProject | undefined> {
    return this.blogProjects.get(id);
  }

  async updateBlogProject(id: number, updates: Partial<InsertBlogProject>): Promise<BlogProject> {
    const existing = this.blogProjects.get(id);
    if (!existing) {
      throw new Error(`Blog project with id ${id} not found`);
    }

    const updated: BlogProject = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.blogProjects.set(id, updated);
    return updated;
  }

  async getBlogProjectsByUser(userId: number): Promise<BlogProject[]> {
    return Array.from(this.blogProjects.values()).filter(
      (project) => project.userId === userId,
    );
  }

  async deleteBlogProject(id: number): Promise<boolean> {
    return this.blogProjects.delete(id);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      projectId: insertMessage.projectId || null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(projectId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async deleteChatMessages(projectId: number): Promise<boolean> {
    const messages = Array.from(this.chatMessages.values())
      .filter((message) => message.projectId === projectId);
    
    messages.forEach((message) => {
      this.chatMessages.delete(message.id);
    });
    
    return true;
  }
}

export const storage = new MemStorage();
