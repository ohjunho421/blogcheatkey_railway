import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ProgressStepper } from "@/components/ProgressStepper";
import { KeywordAnalysisForm } from "@/components/KeywordAnalysisForm";
import { AIModelStatus } from "@/components/AIModelStatus";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { ContentGenerationForm } from "@/components/ContentGenerationForm";
import { BlogContentDisplay } from "@/components/BlogContentDisplay";
import { EditingChat } from "@/components/EditingChat";
import { ReferenceLinks } from "@/components/ReferenceLinks";
import { InfographicGallery } from "@/components/InfographicGallery";
import { ReferenceBlogLinksForm } from "@/components/ReferenceBlogLinksForm";
import { GenerateBlogButton } from "@/components/GenerateBlogButton";
import { MessageSquare, FileText, Search, Building2, Sparkles, RotateCw, LogOut, User, ChevronDown, CreditCard, Shield } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import Footer from "@/components/Footer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const projectId = location.includes('/project/') ? parseInt(location.split('/project/')[1]) : null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "로그아웃",
        description: "성공적으로 로그아웃되었습니다.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "오류",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  const getCurrentStepIndex = () => {
    if (!project) return 0;
    switch ((project as any).status) {
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
              <PaymentModal>
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  구독하기
                </Button>
              </PaymentModal>
              
              {(project as any) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  새 프로젝트
                </Button>
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.name}님
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/subscribe")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      구독하기
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      작성 내역
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        관리자 페이지
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section - 프로젝트가 있거나 새로 만들 때 항상 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">프로젝트 진행 상황</h2>
            {(project as any) && (
              <Badge variant="secondary">
                키워드: {(project as any).keyword}
              </Badge>
            )}
          </div>
          <Progress value={(project as any) ? getProgressPercentage() : 0} className="mb-4" />
          <ProgressStepper currentStep={(project as any) ? getCurrentStepIndex() : 0} />
        </div>

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
                  <span className="text-sm font-medium text-primary">15-17회</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">글자수 범위</span>
                  <span className="text-sm font-medium text-primary">1700-1800자</span>
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
            {(project as any) && ((project as any).status === 'business_info' || (project as any).status === 'content_generation' || (project as any).status === 'completed') && (
              <BusinessInfoForm 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Content Generation Form - Show after business info is saved */}
            {(project as any) && ((project as any).status === 'content_generation' || (project as any).status === 'completed') && (
              <ContentGenerationForm 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Reference Blog Links Form - Show after business info */}
            {(project as any) && ((project as any).status === 'business_info' || (project as any).status === 'content_generation' || (project as any).status === 'completed') && (
              <ReferenceBlogLinksForm 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Blog Generation Button - Below Reference Blog Links Form */}
            {(project as any) && (project as any).status === 'business_info' && (project as any).businessInfo && !(project as any).generatedContent && (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">모든 정보가 준비되었습니다!</h3>
                      <p className="text-sm text-muted-foreground">
                        업체 정보, 참고 링크, 추가 형태소가 설정되었습니다.
                        <br />이제 SEO 최적화된 블로그를 생성해보세요.
                      </p>
                    </div>
                    <GenerateBlogButton project={project as any} onRefresh={refetch} />
                  </div>
                </CardContent>
              </Card>
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

            {/* Editing Chat - Moved above Infographic Gallery */}
            {project && project.status === 'completed' && (
              <EditingChat 
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
            {project && project.researchData?.citations && (
              <ReferenceLinks 
                links={project.researchData.citations} 
                citationsWithTitles={project.researchData.citationsWithTitles} 
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
