import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Crown, Shield, Activity } from "lucide-react";
import type { User } from "@shared/schema";

interface UserManagementTabProps {
  users: User[];
}

export function UserManagementTab({ users }: UserManagementTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  // Grant subscription mutation
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
      toast({
        title: "구독 권한 부여 완료",
        description: "사용자에게 구독 권한이 부여되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "구독 권한 부여 실패",
        description: error.message || "권한 부여에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // Revoke subscription mutation
  const revokeSubscriptionMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/revoke-subscription`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "구독 권한 해제 완료",
        description: "사용자의 구독 권한이 해제되었습니다.",
      });
    },
  });

  const getSubscriptionStatus = (user: User) => {
    if (!user.subscriptionExpiresAt) return { text: "없음", color: "bg-gray-500" };
    
    const expiresAt = new Date(user.subscriptionExpiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: "만료됨", color: "bg-red-500" };
    if (daysLeft <= 7) return { text: `${daysLeft}일 남음`, color: "bg-yellow-500" };
    return { text: `${daysLeft}일 남음`, color: "bg-green-500" };
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const status = getSubscriptionStatus(user);
            
            return (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                      {user.isAdmin && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          관리자
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
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

                    {user.subscriptionExpiresAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        만료: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
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
                  </div>
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              등록된 사용자가 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
