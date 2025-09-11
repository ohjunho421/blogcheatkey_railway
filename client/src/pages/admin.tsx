import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Users, Shield, Crown } from "lucide-react";
import type { User, UpdateUserPermissions } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all users with stats
  const { data: users, isLoading: usersLoading } = useQuery<(User & { completedProjectsCount: number; totalProjectsCount: number })[]>({
    queryKey: ["/api/admin/users/stats"],
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: UpdateUserPermissions }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/permissions`, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({
        title: "권한 업데이트 완료",
        description: "사용자 권한이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "권한 업데이트 실패",
        description: error.message || "권한 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // Make admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: async ({ email, adminSecret }: { email: string; adminSecret: string }) => {
      return await apiRequest("POST", "/api/admin/make-admin", { email, adminSecret });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({
        title: "관리자 권한 부여 완료",
        description: "사용자에게 관리자 권한이 부여되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "관리자 권한 부여 실패",
        description: error.message || "관리자 권한 부여에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const [makeAdminForm, setMakeAdminForm] = useState({
    email: "",
    adminSecret: "",
  });

  const handlePermissionUpdate = (userId: number, permissions: Partial<UpdateUserPermissions>) => {
    updatePermissionsMutation.mutate({ userId, permissions });
  };

  const handleMakeAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    makeAdminMutation.mutate(makeAdminForm);
    setMakeAdminForm({ email: "", adminSecret: "" });
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case "premium": return "bg-purple-500";
      case "basic": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              관리자 대시보드
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            사용자 권한 관리 및 시스템 설정을 관리합니다.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              시스템 설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6">
              {users?.map((user) => (
                <Card key={user.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          {user.isAdmin && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSubscriptionBadgeColor(user.subscriptionTier || "basic")}>
                            {user.subscriptionTier === "basic" ? "베이직 (5만원)" : 
                             user.subscriptionTier === "premium" ? "프리미엄 (10만원)" : "미설정"}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">비활성</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        가입일: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '정보 없음'}
                      </p>
                      {user.paymentDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          입금일: {new Date(user.paymentDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      {user.subscriptionExpiresAt && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          만료일: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      <div className="text-xs text-green-600 dark:text-green-400 flex gap-4">
                        <span>작성 글: {user.completedProjectsCount}개</span>
                        <span>전체 프로젝트: {user.totalProjectsCount}개</span>
                      </div>
                    </div>

                    <div className="space-y-4 min-w-[300px]">
                      {/* 입금일 입력 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">입금일 입력 (한달 후 자동 만료)</Label>
                        <Input
                          type="date"
                          onChange={(e) => {
                            if (e.target.value) {
                              const paymentDate = new Date(e.target.value).toISOString();
                              handlePermissionUpdate(user.id, { 
                                paymentDate: paymentDate,
                                isActive: true
                              });
                            }
                          }}
                          className="text-sm"
                        />
                      </div>

                      {/* 구독 등급 설정 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">구독 등급 (자동 권한 부여)</Label>
                        <Select
                          value={user.subscriptionTier || "basic"}
                          onValueChange={(value) => 
                            handlePermissionUpdate(user.id, { 
                              subscriptionTier: value as "basic" | "premium"
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">베이직 (5만원) - 콘텐츠 생성</SelectItem>
                            <SelectItem value="premium">프리미엄 (10만원) - 콘텐츠 + 챗봇</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 수동 권한 스위치들 (구독등급 설정 시 자동으로 변경됨) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`active-${user.id}`}
                            checked={user.isActive ?? true}
                            onCheckedChange={(checked) => 
                              handlePermissionUpdate(user.id, { isActive: checked })
                            }
                          />
                          <Label htmlFor={`active-${user.id}`} className="text-sm">
                            활성 계정
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`content-${user.id}`}
                            checked={user.canGenerateContent ?? false}
                            onCheckedChange={(checked) => 
                              handlePermissionUpdate(user.id, { canGenerateContent: checked })
                            }
                          />
                          <Label htmlFor={`content-${user.id}`} className="text-sm">
                            콘텐츠 생성
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`images-${user.id}`}
                            checked={user.canGenerateImages ?? false}
                            onCheckedChange={(checked) => 
                              handlePermissionUpdate(user.id, { canGenerateImages: checked })
                            }
                          />
                          <Label htmlFor={`images-${user.id}`} className="text-sm">
                            이미지 생성
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`chatbot-${user.id}`}
                            checked={user.canUseChatbot ?? false}
                            onCheckedChange={(checked) => 
                              handlePermissionUpdate(user.id, { canUseChatbot: checked })
                            }
                          />
                          <Label htmlFor={`chatbot-${user.id}`} className="text-sm">
                            챗봇 이용
                          </Label>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        ※ 구독 등급 설정 시 해당 권한들이 자동으로 활성화됩니다
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>관리자 권한 부여</CardTitle>
                <CardDescription>
                  새로운 사용자에게 관리자 권한을 부여합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMakeAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 주소</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={makeAdminForm.email}
                      onChange={(e) => setMakeAdminForm(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminSecret">관리자 비밀번호</Label>
                    <Input
                      id="adminSecret"
                      type="password"
                      placeholder="관리자 비밀번호를 입력하세요"
                      value={makeAdminForm.adminSecret}
                      onChange={(e) => setMakeAdminForm(prev => ({
                        ...prev,
                        adminSecret: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={makeAdminMutation.isPending}
                    className="w-full"
                  >
                    {makeAdminMutation.isPending ? "처리 중..." : "관리자 권한 부여"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>관리자 권한 관리</CardTitle>
                <CardDescription>
                  기존 사용자의 관리자 권한을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.filter(user => user.isAdmin).map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`admin-permission-${admin.id}`}
                          checked={admin.isAdmin ?? false}
                          onCheckedChange={(checked) => 
                            handlePermissionUpdate(admin.id, { isAdmin: checked })
                          }
                        />
                        <Label htmlFor={`admin-permission-${admin.id}`} className="text-sm">
                          관리자 권한
                        </Label>
                      </div>
                    </div>
                  ))}
                  
                  {users?.filter(user => user.isAdmin).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      현재 관리자 권한을 가진 사용자가 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시스템 통계</CardTitle>
                <CardDescription>
                  전체 시스템 사용 현황을 확인합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {users?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      전체 사용자
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {users?.filter(u => u.isActive).length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      활성 사용자
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {users?.filter(u => u.subscriptionTier !== "none").length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      유료 구독자
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {users?.filter(u => u.isAdmin).length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      관리자
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}