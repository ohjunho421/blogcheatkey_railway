import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Crown, Shield, Activity, Search, Wrench, ChevronDown, ChevronUp, X } from "lucide-react";
import type { User } from "@shared/schema";

interface UserManagementTabProps {
  users: User[];
}

type FilterType = "all" | "basic" | "premium" | "override" | "expired";

export function UserManagementTab({ users }: UserManagementTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // === Mutations ===

  // Grant subscription mutation (existing)
  const grantSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, planType, duration }: {
      userId: number;
      planType: 'basic' | 'premium';
      duration: number;
    }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/grant-subscription`, {
        planType,
        duration
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setGrantDialogOpen(false);
      toast({ title: "구독 권한 부여 완료", description: "사용자에게 구독 권한이 부여되었습니다." });
    },
    onError: (error: any) => {
      toast({ title: "구독 권한 부여 실패", description: error.message || "권한 부여에 실패했습니다.", variant: "destructive" });
    },
  });

  // Revoke subscription mutation (existing)
  const revokeSubscriptionMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/revoke-subscription`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "구독 권한 해제 완료", description: "사용자의 구독 권한이 해제되었습니다." });
    },
  });

  // Override plan mutation (new)
  const overridePlanMutation = useMutation({
    mutationFn: async ({ userId, planType, duration, note }: {
      userId: number;
      planType: 'basic' | 'premium';
      duration: number;
      note: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/override-plan`, {
        planType,
        duration,
        note,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setOverrideDialogOpen(false);
      toast({ title: "플랜 오버라이드 적용", description: "사용자의 플랜이 오버라이드되었습니다." });
    },
    onError: (error: any) => {
      toast({ title: "오버라이드 실패", description: error.message || "오버라이드 적용에 실패했습니다.", variant: "destructive" });
    },
  });

  // Remove override mutation (new)
  const removeOverrideMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/remove-override`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "오버라이드 해제", description: "플랜 오버라이드가 해제되었습니다." });
    },
    onError: (error: any) => {
      toast({ title: "해제 실패", description: error.message || "오버라이드 해제에 실패했습니다.", variant: "destructive" });
    },
  });

  // Update individual permissions mutation (new)
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: {
      userId: number;
      permissions: { canGenerateContent?: boolean; canUseChatbot?: boolean; canGenerateImages?: boolean };
    }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/update-permissions`, permissions);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "권한 업데이트", description: "개별 권한이 변경되었습니다." });
    },
    onError: (error: any) => {
      toast({ title: "권한 변경 실패", description: error.message || "권한 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  // === Helpers ===

  const getSubscriptionStatus = (user: User) => {
    if (!user.subscriptionExpiresAt) return { text: "없음", color: "bg-gray-500" };

    const expiresAt = new Date(user.subscriptionExpiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: "만료됨", color: "bg-red-500" };
    if (daysLeft <= 7) return { text: `${daysLeft}일 남음`, color: "bg-yellow-500" };
    if (daysLeft > 36500) return { text: "무기한", color: "bg-blue-500" };
    return { text: `${daysLeft}일 남음`, color: "bg-green-500" };
  };

  const hasActiveOverride = (user: User) => {
    return !!(user as any).adminOverridePlan && (
      !(user as any).adminOverrideExpiresAt || new Date((user as any).adminOverrideExpiresAt) > new Date()
    );
  };

  // === Filtering & Searching ===

  const filteredUsers = users.filter((user) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = user.name?.toLowerCase().includes(query);
      const matchesEmail = user.email?.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail) return false;
    }

    // Type filter
    switch (filterType) {
      case "basic":
        return user.subscriptionTier === "basic" || !user.subscriptionTier;
      case "premium":
        return user.subscriptionTier === "premium";
      case "override":
        return hasActiveOverride(user);
      case "expired":
        return user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date();
      default:
        return true;
    }
  });

  // === Dialogs ===

  const OverridePlanDialog = ({ user }: { user: User }) => {
    const [planType, setPlanType] = useState<'basic' | 'premium'>('premium');
    const [durationType, setDurationType] = useState<string>('unlimited');
    const [customDuration, setCustomDuration] = useState<number>(30);
    const [note, setNote] = useState('');

    const getDuration = () => {
      switch (durationType) {
        case 'unlimited': return 0;
        case '30': return 30;
        case '60': return 60;
        case '90': return 90;
        case '365': return 365;
        case 'custom': return customDuration;
        default: return 0;
      }
    };

    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            플랜 오버라이드
          </DialogTitle>
          <DialogDescription>
            {user.name || user.email}의 플랜을 관리자 권한으로 오버라이드합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan selection */}
          <div>
            <Label>플랜 선택</Label>
            <Select value={planType} onValueChange={(v) => setPlanType(v as 'basic' | 'premium')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">베이직 플랜</SelectItem>
                <SelectItem value="premium">프리미엄 플랜</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration selection */}
          <div>
            <Label>기간</Label>
            <Select value={durationType} onValueChange={setDurationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">무기한</SelectItem>
                <SelectItem value="30">30일 (1개월)</SelectItem>
                <SelectItem value="60">60일 (2개월)</SelectItem>
                <SelectItem value="90">90일 (3개월)</SelectItem>
                <SelectItem value="365">365일 (1년)</SelectItem>
                <SelectItem value="custom">직접 입력</SelectItem>
              </SelectContent>
            </Select>
            {durationType === 'custom' && (
              <Input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                min={1}
                max={3650}
                className="mt-2"
                placeholder="일수 입력"
              />
            )}
          </div>

          {/* Note */}
          <div>
            <Label>사유 메모 (선택)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: VIP 고객, 테스트 계정, 이벤트 당첨 등"
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Permissions preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
            <p className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">부여될 권한:</p>
            <ul className="text-sm space-y-1">
              <li>✅ 콘텐츠 생성</li>
              <li>✅ 챗봇 사용</li>
              {planType === 'premium' && (
                <>
                  <li>✅ 이미지 생성 (프리미엄 전용)</li>
                  <li>✅ 무제한 프로젝트</li>
                </>
              )}
            </ul>
          </div>

          <Button
            onClick={() => {
              overridePlanMutation.mutate({
                userId: user.id,
                planType,
                duration: getDuration(),
                note,
              });
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={overridePlanMutation.isPending}
          >
            <Wrench className="h-4 w-4 mr-2" />
            {overridePlanMutation.isPending ? "처리 중..." : "오버라이드 적용"}
          </Button>
        </div>
      </DialogContent>
    );
  };

  const GrantSubscriptionDialog = ({ user }: { user: User }) => {
    const [planType, setPlanType] = useState<'basic' | 'premium'>('basic');
    const [duration, setDuration] = useState<number>(30);

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>구독 권한 부여</DialogTitle>
          <DialogDescription>
            {user.name || user.email}에게 구독 권한을 부여합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>플랜 선택</Label>
            <Select value={planType} onValueChange={(v) => setPlanType(v as 'basic' | 'premium')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">베이직 플랜 (50,000원)</SelectItem>
                <SelectItem value="premium">프리미엄 플랜 (100,000원)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>기간 (일)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={365}
            />
            <p className="text-xs text-muted-foreground mt-1">
              보통 30일 (1개월) 입니다
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">부여될 권한:</p>
            <ul className="text-sm space-y-1">
              <li>✅ 콘텐츠 생성</li>
              <li>✅ 챗봇 사용</li>
              {planType === 'premium' && (
                <>
                  <li>✅ 이미지 생성 (프리미엄 전용)</li>
                  <li>✅ 무제한 프로젝트</li>
                </>
              )}
            </ul>
          </div>

          <Button
            onClick={() => {
              grantSubscriptionMutation.mutate({
                userId: user.id,
                planType,
                duration
              });
            }}
            className="w-full"
            disabled={grantSubscriptionMutation.isPending}
          >
            {grantSubscriptionMutation.isPending ? "처리 중..." : "권한 부여"}
          </Button>
        </div>
      </DialogContent>
    );
  };

  // === Permission Toggle Row ===
  const PermissionToggle = ({ user, field, label }: {
    user: User;
    field: 'canGenerateContent' | 'canUseChatbot' | 'canGenerateImages';
    label: string;
  }) => {
    const currentValue = user[field] ?? false;

    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-sm">{label}</span>
        <Switch
          checked={currentValue}
          onCheckedChange={(checked) => {
            updatePermissionsMutation.mutate({
              userId: user.id,
              permissions: { [field]: checked },
            });
          }}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 목록</CardTitle>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 ({users.length})</SelectItem>
              <SelectItem value="basic">베이직</SelectItem>
              <SelectItem value="premium">프리미엄</SelectItem>
              <SelectItem value="override">오버라이드</SelectItem>
              <SelectItem value="expired">만료됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const status = getSubscriptionStatus(user);
            const isOverride = hasActiveOverride(user);
            const isExpanded = expandedUserId === user.id;

            return (
              <div key={user.id} className={`border rounded-lg transition-all ${isOverride ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                        {user.isAdmin && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            관리자
                          </Badge>
                        )}
                        {isOverride && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            오버라이드
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          {user.subscriptionTier === 'premium' ? '프리미엄' : '베이직'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {user.totalTokensUsed?.toLocaleString() || 0} 토큰
                        </Badge>
                      </div>

                      {user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getFullYear() < 2090 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          만료: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ko-KR')}
                        </p>
                      )}

                      {/* Override note */}
                      {isOverride && (user as any).adminOverrideNote && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                          📝 {(user as any).adminOverrideNote}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap items-start ml-4">
                      {/* Override button */}
                      <Dialog open={overrideDialogOpen && selectedUser?.id === user.id} onOpenChange={setOverrideDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            오버라이드
                          </Button>
                        </DialogTrigger>
                        {selectedUser?.id === user.id && <OverridePlanDialog user={user} />}
                      </Dialog>

                      {/* Remove override button */}
                      {isOverride && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                          onClick={() => {
                            if (confirm('오버라이드를 해제하시겠습니까? 기본 플랜으로 복원됩니다.')) {
                              removeOverrideMutation.mutate(user.id);
                            }
                          }}
                          disabled={removeOverrideMutation.isPending}
                        >
                          해제
                        </Button>
                      )}

                      {/* Grant subscription button */}
                      <Dialog open={grantDialogOpen && selectedUser?.id === user.id} onOpenChange={setGrantDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            권한 부여
                          </Button>
                        </DialogTrigger>
                        {selectedUser?.id === user.id && <GrantSubscriptionDialog user={user} />}
                      </Dialog>

                      {/* Revoke button */}
                      {user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date() && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('정말 이 사용자의 구독을 해제하시겠습니까?')) {
                              revokeSubscriptionMutation.mutate(user.id);
                            }
                          }}
                        >
                          권한 해제
                        </Button>
                      )}

                      {/* Expand/collapse toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded: Individual Permission Toggles */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <p className="text-sm font-medium mb-2">개별 권한 관리</p>
                    <div className="space-y-1">
                      <PermissionToggle user={user} field="canGenerateContent" label="콘텐츠 생성" />
                      <PermissionToggle user={user} field="canUseChatbot" label="챗봇 사용" />
                      <PermissionToggle user={user} field="canGenerateImages" label="이미지 생성" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      플랜과 무관하게 개별 기능을 켜거나 끌 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterType !== "all"
                ? "검색 결과가 없습니다."
                : "등록된 사용자가 없습니다."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
