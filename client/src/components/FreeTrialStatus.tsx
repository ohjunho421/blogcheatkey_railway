import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PaymentModal from "@/components/PaymentModal";

const MAX_FREE_GENERATIONS = 3;

export function FreeTrialStatus() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  // 관리자는 무제한
  if (user.isAdmin) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-700">관리자 계정</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              무제한
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 유료 구독자 체크
  const hasActiveSubscription = user.subscriptionExpiresAt && 
    new Date(user.subscriptionExpiresAt) > new Date();
  const hadPreviousSubscription = user.subscriptionExpiresAt !== null && user.subscriptionExpiresAt !== undefined;

  if (hasActiveSubscription) {
    const expiresAt = new Date(user.subscriptionExpiresAt!);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">프리미엄 구독</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                무제한
              </Badge>
            </div>
            <span className="text-sm text-green-600">
              {daysLeft}일 남음
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 구독 만료 사용자 - 무료 체험 없이 바로 결제 필요
  if (hadPreviousSubscription) {
    const expiredAt = new Date(user.subscriptionExpiresAt!);
    
    return (
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-orange-700">구독 만료</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-orange-600">
            구독이 {expiredAt.toLocaleDateString('ko-KR')}에 만료되었습니다.
          </p>
          <p className="text-xs text-orange-500">
            계속 사용하시려면 구독을 갱신해주세요.
          </p>
          <PaymentModal>
            <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Crown className="h-4 w-4 mr-2" />
              구독 갱신하기
            </Button>
          </PaymentModal>
        </CardContent>
      </Card>
    );
  }

  // 신규 무료 사용자
  const usedCount = user.freeGenerationCount || 0;
  const remainingCount = Math.max(0, MAX_FREE_GENERATIONS - usedCount);
  const progressPercent = (usedCount / MAX_FREE_GENERATIONS) * 100;
  const isLimitReached = usedCount >= MAX_FREE_GENERATIONS;

  return (
    <Card className={`${isLimitReached ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isLimitReached ? (
            <>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">무료 체험 종료</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700">무료 체험</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={isLimitReached ? 'text-red-600' : 'text-blue-600'}>
            사용: {usedCount} / {MAX_FREE_GENERATIONS}회
          </span>
          <span className={`font-medium ${isLimitReached ? 'text-red-700' : 'text-blue-700'}`}>
            {isLimitReached ? '0회 남음' : `${remainingCount}회 남음`}
          </span>
        </div>
        
        <Progress 
          value={progressPercent} 
          className={`h-2 ${isLimitReached ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
        />

        {isLimitReached ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600">
              무료 체험 횟수를 모두 사용하셨습니다. 계속 사용하시려면 구독이 필요합니다.
            </p>
            <PaymentModal>
              <Button size="sm" className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                <Crown className="h-4 w-4 mr-2" />
                지금 구독하기
              </Button>
            </PaymentModal>
          </div>
        ) : (
          <p className="text-xs text-blue-600">
            무료로 {remainingCount}회 더 블로그 글을 생성할 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default FreeTrialStatus;
