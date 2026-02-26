import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, Loader2, User, Mail, Phone, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "업데이트 실패");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "저장 완료",
        description: "프로필이 업데이트되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message || "프로필 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const hasActiveSubscription =
    user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">프로필 설정</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 프로필 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback className="text-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 기본 정보 수정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
            <CardDescription>이름과 휴대폰 번호를 수정할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                이메일
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                이름
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                휴대폰 번호
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
              />
              <p className="text-xs text-muted-foreground">결제 시 사용됩니다. 하이픈(-) 없이 입력해주세요.</p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 구독 정보 */}
        <Card className={`rounded-2xl border border-border/50 ${hasActiveSubscription ? 'border-l-4 border-green-500' : 'border-l-4 border-orange-500'}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              구독 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">구독 상태</span>
              {hasActiveSubscription ? (
                <Badge className="bg-green-100 text-green-800">활성</Badge>
              ) : (
                <Badge variant="secondary">미구독</Badge>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">요금제</span>
              <span className="text-sm font-medium">
                {user.subscriptionTier === "premium" ? "프리미엄" : "베이직"}
              </span>
            </div>
            {hasActiveSubscription && user.subscriptionExpiresAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">만료일</span>
                <span className="text-sm">
                  {new Date(user.subscriptionExpiresAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            )}
            {!hasActiveSubscription && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/subscribe")}
              >
                구독하기
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 보안 */}
        <Card className="rounded-2xl border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              보안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">비밀번호를 변경하거나 보안을 관리하세요</p>
            <Button variant="outline" size="sm">비밀번호 변경 이메일 전송</Button>
          </CardContent>
        </Card>

        {/* 위험 영역 */}
        <Card className="rounded-2xl border border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">위험 영역</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">
              계정 삭제 요청
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
