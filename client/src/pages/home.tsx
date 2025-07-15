import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ProgressStepper } from "@/components/ProgressStepper";
import { KeywordAnalysisForm } from "@/components/KeywordAnalysisForm";
import { AIModelStatus } from "@/components/AIModelStatus";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { BlogContentDisplay } from "@/components/BlogContentDisplay";
import { EditingChat } from "@/components/EditingChat";
import { ReferenceLinks } from "@/components/ReferenceLinks";
import { InfographicGallery } from "@/components/InfographicGallery";
import { MessageSquare, FileText, Search, Building2, Sparkles, RotateCw } from "lucide-react";

export default function Home() {
  const [location, navigate] = useLocation();
  const projectId = location.includes('/project/') ? parseInt(location.split('/project/')[1]) : null;

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  const getCurrentStepIndex = () => {
    if (!project) return 0;
    switch (project.status) {
      case 'keyword_analysis': return 0;
      case 'data_collection': return 1;
      case 'business_info': return 2;
      case 'content_generation': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const getProgressPercentage = () => {
    return ((getCurrentStepIndex() + 1) / 4) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">블로그치트키</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">대시보드</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">작성 내역</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">설정</a>
            </nav>
            <div className="flex items-center space-x-3">
              {project && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  새 프로젝트
                </Button>
              )}
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <span className="text-sm text-muted-foreground">김자영님</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        {project && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">프로젝트 진행 상황</h2>
              <Badge variant="secondary">
                키워드: {project.keyword}
              </Badge>
            </div>
            <Progress value={getProgressPercentage()} className="mb-4" />
            <ProgressStepper currentStep={getCurrentStepIndex()} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Keyword Analysis Form */}
            <KeywordAnalysisForm 
              onProjectCreated={(newProject) => {
                navigate(`/project/${newProject.id}`);
              }}
              project={project}
              onRefresh={refetch}
            />

            {/* AI Model Status */}
            <AIModelStatus project={project} />

            {/* SEO Settings Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Sparkles className="h-5 w-5 text-primary mr-2" />
                  SEO 최적화 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">키워드 출현 빈도</span>
                  <span className="text-sm font-medium text-primary">17-20회</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">글자수 범위</span>
                  <span className="text-sm font-medium text-primary">1700-2000자</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">구조</span>
                  <span className="text-sm font-medium text-primary">서론-본론(4개)-결론</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info Form - Show after data collection */}
            {project && (project.status === 'business_info' || project.status === 'content_generation' || project.status === 'completed') && (
              <BusinessInfoForm 
                project={project} 
                onRefresh={refetch}
              />
            )}

            {/* Content Generation Status */}
            {project && project.status === 'content_generation' && !project.generatedContent && (
              <Card className="border-accent">
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                      <RotateCw className="h-8 w-8 text-accent animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-accent">블로그 생성 중...</h3>
                      <p className="text-muted-foreground mt-2">
                        Claude가 SEO 최적화된 블로그 포스트를 작성하고 있습니다.
                        <br />잠시만 기다려주세요. (약 30-60초 소요)
                      </p>
                    </div>
                    <div className="flex justify-center space-x-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        키워드 분석 완료
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        자료 수집 완료
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                        콘텐츠 생성 중
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blog Content Display */}
            {project && project.generatedContent && (
              <BlogContentDisplay 
                project={project} 
                onRefresh={refetch}
              />
            )}

            {/* Infographic Gallery */}
            {project && project.generatedImages && (
              <InfographicGallery 
                project={project} 
                onRefresh={refetch}
              />
            )}

            {/* Reference Links */}
            {project && project.referenceLinks && (
              <ReferenceLinks links={project.referenceLinks as string[]} />
            )}

            {/* Editing Chat */}
            {project && project.status === 'completed' && (
              <EditingChat 
                project={project} 
                onRefresh={refetch}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2024 블로그치트키. AI 기반 SEO 최적화 블로그 작성 도구</p>
            <p className="mt-2">Powered by Gemini 2.5 Pro, Claude 4, Perplexity Sonar Pro</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
