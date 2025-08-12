import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Tag, ExternalLink, Copy, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface CompletedProject {
  id: number;
  title: string;
  keyword: string;
  content: string;
  referenceData: any;
  createdAt: string;
  userId: number;
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: projects = [], isLoading } = useQuery<CompletedProject[]>({
    queryKey: ["/api/completed-projects"],
    enabled: !!user,
  });

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "복사 완료",
        description: "글 내용이 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm");
    } catch {
      return dateString;
    }
  };

  const extractReferences = (referenceData: any) => {
    if (!referenceData) return [];
    
    try {
      const data = typeof referenceData === 'string' ? JSON.parse(referenceData) : referenceData;
      
      if (data.sources && Array.isArray(data.sources)) {
        return data.sources.slice(0, 3); // 최대 3개까지만 표시
      }
      
      if (data.results && Array.isArray(data.results)) {
        return data.results.slice(0, 3).map((result: any) => ({
          title: result.title,
          url: result.url
        }));
      }
      
      return [];
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 mb-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              이전 페이지로 돌아가기
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">작성 내역</h1>
              <p className="text-muted-foreground">
                완성된 블로그 글들을 날짜별로 확인하고 관리하세요
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>총 {projects.length}개의 완성된 글</span>
            {user && (
              <span>• {user.name}님의 작성내역</span>
            )}
          </div>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">아직 완성된 글이 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                첫 번째 블로그 글을 작성해보세요
              </p>
              <Button onClick={() => navigate('/')}>
                새 글 작성하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => {
              const references = extractReferences(project.referenceData);
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 line-clamp-2">
                          {project.title || `${project.keyword} 관련 블로그 글`}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(project.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            <Badge variant="secondary" className="text-xs">
                              {project.keyword}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(project.content)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        복사
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Content Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">글 내용 미리보기</h4>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {project.content.substring(0, 200)}...
                      </p>
                    </div>
                    
                    {/* Reference Sources */}
                    {references.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          참고 자료 ({references.length}개)
                        </h4>
                        <div className="space-y-2">
                          {references.map((ref: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-900 truncate">
                                  {ref.title || `참고자료 ${index + 1}`}
                                </p>
                                {ref.url && (
                                  <p className="text-xs text-blue-600 truncate">
                                    {ref.url}
                                  </p>
                                )}
                              </div>
                              {ref.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(ref.url, '_blank')}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                      <span>글자 수: {project.content.length}자</span>
                      <span>참고자료: {references.length}개</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}