import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, Users, MousePointerClick, Eye, Clock, 
  RefreshCw, ExternalLink, Activity, Target, Zap
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";

interface AnalyticsData {
  pageViews: { date: string; count: number }[];
  uniqueUsers: { date: string; count: number }[];
  topEvents: { event: string; count: number }[];
  topPages: { page: string; views: number }[];
  userFlow: { step: string; users: number }[];
  conversionFunnel: { stage: string; count: number; percentage: number }[];
  sessionDuration: { range: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: string;
    contentGenerations: number;
    signups: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PostHog 분석 데이터 조회
  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", dateRange],
    refetchInterval: 60000, // 1분마다 자동 갱신
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // 날짜 범위 옵션
  const dateRangeOptions = [
    { value: "1d", label: "오늘" },
    { value: "7d", label: "최근 7일" },
    { value: "30d", label: "최근 30일" },
    { value: "90d", label: "최근 90일" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">분석 데이터 로딩 중...</span>
      </div>
    );
  }

  // 기본 데이터 (API 응답이 없을 경우)
  const defaultAnalytics: AnalyticsData = {
    pageViews: [],
    uniqueUsers: [],
    topEvents: [],
    topPages: [],
    userFlow: [],
    conversionFunnel: [
      { stage: "방문", count: 0, percentage: 100 },
      { stage: "회원가입", count: 0, percentage: 0 },
      { stage: "콘텐츠 생성", count: 0, percentage: 0 },
      { stage: "구독", count: 0, percentage: 0 },
    ],
    sessionDuration: [],
    deviceBreakdown: [],
    summary: {
      totalPageViews: 0,
      uniqueVisitors: 0,
      avgSessionDuration: "0:00",
      bounceRate: "0%",
      contentGenerations: 0,
      signups: 0,
    },
  };

  const data = analytics || defaultAnalytics;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">사용자 행동 분석</h2>
          <p className="text-muted-foreground">PostHog를 통한 실시간 사용자 행동 분석</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://us.posthog.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              PostHog 대시보드
            </a>
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">페이지뷰</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">전체 페이지 조회수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">순 방문자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">고유 방문자 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">평균 체류시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgSessionDuration}</div>
            <p className="text-xs text-muted-foreground">세션당 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이탈률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.bounceRate}</div>
            <p className="text-xs text-muted-foreground">단일 페이지 이탈</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">콘텐츠 생성</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.contentGenerations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">AI 콘텐츠 생성 횟수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">신규 가입</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.signups.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">신규 회원가입</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 탭 */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">트래픽</TabsTrigger>
          <TabsTrigger value="events">이벤트</TabsTrigger>
          <TabsTrigger value="funnel">전환 퍼널</TabsTrigger>
          <TabsTrigger value="pages">페이지</TabsTrigger>
        </TabsList>

        {/* 트래픽 탭 */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>일별 페이지뷰</CardTitle>
                <CardDescription>기간 내 일별 페이지 조회수 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.pageViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        name="페이지뷰"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>일별 순 방문자</CardTitle>
                <CardDescription>기간 내 일별 고유 방문자 수 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.uniqueUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="순 방문자"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>세션 시간 분포</CardTitle>
                <CardDescription>사용자 체류 시간 분포</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sessionDuration}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ffc658" name="세션 수" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>디바이스 분포</CardTitle>
                <CardDescription>접속 디바이스 유형별 비율</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="device"
                      >
                        {data.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 이벤트 탭 */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>주요 이벤트</CardTitle>
              <CardDescription>가장 많이 발생한 사용자 이벤트</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topEvents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="event" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="발생 횟수" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 전환 퍼널 탭 */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전환 퍼널</CardTitle>
              <CardDescription>방문 → 회원가입 → 콘텐츠 생성 → 구독 전환율</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.conversionFunnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value}명 (${props.payload.percentage}%)`,
                        name
                      ]}
                    />
                    <Bar dataKey="count" fill="#82ca9d" name="사용자 수">
                      {data.conversionFunnel.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          opacity={1 - (index * 0.15)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 전환율 요약 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {data.conversionFunnel.slice(1).map((stage, index) => (
                  <div key={stage.stage} className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {data.conversionFunnel[index].stage} → {stage.stage}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {stage.percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">전환율</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 페이지 탭 */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>인기 페이지</CardTitle>
              <CardDescription>가장 많이 조회된 페이지</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="font-medium">{page.page}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(page.views / (data.topPages[0]?.views || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {page.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsTab;
