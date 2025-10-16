import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Activity, BarChart3 } from "lucide-react";
import type { User } from "@shared/schema";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { PaymentManagementTab } from "@/components/admin/PaymentManagementTab";
import { ActivityLogTab } from "@/components/admin/ActivityLogTab";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  
  // Get all users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Get payment records
  const { data: payments } = useQuery({
    queryKey: ["/api/admin/payments"],
  });

  // Get activity logs
  const { data: activities } = useQuery({
    queryKey: ["/api/admin/activities"],
  });

  // Calculate statistics
  const stats = {
    totalUsers: users?.length || 0,
    activeSubscriptions: users?.filter(u => 
      u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()
    ).length || 0,
    pendingPayments: payments?.filter((p: any) => p.paymentStatus === 'pending').length || 0,
    totalTokensUsed: users?.reduce((sum, u) => sum + (u.totalTokensUsed || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">사용자 관리 및 구독 현황을 확인하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">대기 중인 결제</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 토큰 사용량</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="payments">결제 관리</TabsTrigger>
            <TabsTrigger value="activity">활동 로그</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab users={users || []} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagementTab payments={payments || []} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogTab activities={activities || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
