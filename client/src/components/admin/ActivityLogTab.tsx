import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, MessageSquare, TrendingUp } from "lucide-react";

interface ActivityLogTabProps {
  activities: any[];
}

export function ActivityLogTab({ activities }: ActivityLogTabProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_generated':
        return <FileText className="h-4 w-4" />;
      case 'image_generated':
        return <Image className="h-4 w-4" />;
      case 'chatbot_used':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'content_generated':
        return '콘텐츠 생성';
      case 'image_generated':
        return '이미지 생성';
      case 'chatbot_used':
        return '챗봇 사용';
      default:
        return type;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_generated':
        return 'bg-blue-500';
      case 'image_generated':
        return 'bg-purple-500';
      case 'chatbot_used':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Group activities by user
  const activitiesByUser = activities.reduce((acc, activity) => {
    const userId = activity.userId;
    if (!acc[userId]) {
      acc[userId] = {
        userName: activity.userName,
        userEmail: activity.userEmail,
        activities: [],
        totalTokens: 0,
      };
    }
    acc[userId].activities.push(activity);
    acc[userId].totalTokens += activity.tokensUsed || 0;
    return acc;
  }, {} as Record<number, any>);

  const userSummaries = Object.values(activitiesByUser);

  return (
    <div className="space-y-6">
      {/* User Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>사용자별 활동 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userSummaries.map((user: any) => {
              const activityCounts = user.activities.reduce((acc: any, act: any) => {
                acc[act.activityType] = (acc[act.activityType] || 0) + 1;
                return acc;
              }, {});

              return (
                <div key={user.userEmail} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{user.userName}</h3>
                      <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {user.totalTokens.toLocaleString()} 토큰
                    </Badge>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(activityCounts).map(([type, count]: [string, any]) => (
                      <Badge key={type} className={getActivityColor(type)}>
                        <span className="flex items-center gap-1">
                          {getActivityIcon(type)}
                          {getActivityLabel(type)}: {count}회
                        </span>
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    최근 활동: {new Date(user.activities[0].createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              );
            })}

            {userSummaries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                활동 기록이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 20).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.activityType)}`}>
                  {getActivityIcon(activity.activityType)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getActivityLabel(activity.activityType)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{activity.tokensUsed?.toLocaleString() || 0} 토큰</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {activity.details?.keyword && (
                    <p className="text-xs text-muted-foreground mt-1">
                      키워드: {activity.details.keyword}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                최근 활동이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
