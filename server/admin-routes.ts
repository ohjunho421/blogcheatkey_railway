import { Express } from "express";
import { IStorage } from "./storage";
import { db } from "./db";
import { users, userActivityLog, paymentRecords } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function setupAdminRoutes(app: Express, storage: IStorage) {
  
  // Get all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));

      res.json(allUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "사용자 목록 조회에 실패했습니다" });
    }
  });

  // Grant subscription to user
  app.post("/api/admin/users/:id/grant-subscription", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { planType, duration } = req.body; // duration in days

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      // Calculate subscription end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      // Update user permissions
      const permissions = {
        subscriptionTier: planType,
        subscriptionExpiresAt: endDate,
        canGenerateContent: true,
        canUseChatbot: true,
        canGenerateImages: planType === 'premium',
      };

      await storage.updateUserPermissions(userId, permissions);

      res.json({ 
        success: true, 
        message: `${duration}일간 ${planType} 플랜 권한이 부여되었습니다.`,
        expiresAt: endDate 
      });
    } catch (error) {
      console.error("Grant subscription error:", error);
      res.status(500).json({ error: "구독 권한 부여에 실패했습니다" });
    }
  });

  // Revoke subscription from user
  app.post("/api/admin/users/:id/revoke-subscription", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const permissions = {
        subscriptionTier: 'basic',
        subscriptionExpiresAt: null,
        canGenerateContent: false,
        canUseChatbot: false,
        canGenerateImages: false,
      };

      await storage.updateUserPermissions(userId, permissions);

      res.json({ success: true, message: "구독 권한이 해제되었습니다" });
    } catch (error) {
      console.error("Revoke subscription error:", error);
      res.status(500).json({ error: "구독 권한 해제에 실패했습니다" });
    }
  });

  // Get all payment records
  app.get("/api/admin/payments", async (req, res) => {
    try {
      const payments = await db
        .select({
          id: paymentRecords.id,
          userId: paymentRecords.userId,
          userName: users.name,
          userEmail: users.email,
          planType: paymentRecords.planType,
          amount: paymentRecords.amount,
          paymentStatus: paymentRecords.paymentStatus,
          depositorName: paymentRecords.depositorName,
          confirmationNote: paymentRecords.confirmationNote,
          confirmedAt: paymentRecords.confirmedAt,
          createdAt: paymentRecords.createdAt,
        })
        .from(paymentRecords)
        .leftJoin(users, eq(paymentRecords.userId, users.id))
        .orderBy(desc(paymentRecords.createdAt));

      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "결제 내역 조회에 실패했습니다" });
    }
  });

  // Confirm payment
  app.post("/api/admin/payments/:id/confirm", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { note } = req.body;

      // Get payment record
      const [payment] = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.id, paymentId));

      if (!payment) {
        return res.status(404).json({ error: "결제 내역을 찾을 수 없습니다" });
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // 30 days subscription

      // Update payment status
      await db
        .update(paymentRecords)
        .set({
          paymentStatus: 'confirmed',
          confirmationNote: note,
          confirmedAt: new Date(),
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          updatedAt: new Date(),
        })
        .where(eq(paymentRecords.id, paymentId));

      // Grant user permissions
      await storage.updateUserPermissions(payment.userId, {
        subscriptionTier: payment.planType,
        subscriptionExpiresAt: endDate,
        canGenerateContent: true,
        canUseChatbot: true,
        canGenerateImages: payment.planType === 'premium',
      });

      res.json({ success: true, message: "결제가 확인되고 권한이 부여되었습니다" });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: "결제 확인에 실패했습니다" });
    }
  });

  // Reject payment
  app.post("/api/admin/payments/:id/reject", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { note } = req.body;

      await db
        .update(paymentRecords)
        .set({
          paymentStatus: 'cancelled',
          confirmationNote: note,
          updatedAt: new Date(),
        })
        .where(eq(paymentRecords.id, paymentId));

      res.json({ success: true, message: "결제가 거절되었습니다" });
    } catch (error) {
      console.error("Reject payment error:", error);
      res.status(500).json({ error: "결제 거절에 실패했습니다" });
    }
  });

  // Get activity logs
  app.get("/api/admin/activities", async (req, res) => {
    try {
      const activities = await db
        .select({
          id: userActivityLog.id,
          userId: userActivityLog.userId,
          userName: users.name,
          userEmail: users.email,
          activityType: userActivityLog.activityType,
          tokensUsed: userActivityLog.tokensUsed,
          details: userActivityLog.details,
          createdAt: userActivityLog.createdAt,
        })
        .from(userActivityLog)
        .leftJoin(users, eq(userActivityLog.userId, users.id))
        .orderBy(desc(userActivityLog.createdAt))
        .limit(100);

      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "활동 로그 조회에 실패했습니다" });
    }
  });
}
