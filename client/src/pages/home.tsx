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
import { BlogContentDisplay } from "@/components/BlogContentDisplay";
import { EditingChat } from "@/components/EditingChat";
import { SessionManager } from "@/components/SessionManager";
import { ReferenceLinks } from "@/components/ReferenceLinks";
import { InfographicGallery } from "@/components/InfographicGallery";
import { ReferenceBlogLinksForm } from "@/components/ReferenceBlogLinksForm";
import { GenerateBlogButton } from "@/components/GenerateBlogButton";
import { RequiredItemsCheck } from "@/components/RequiredItemsCheck";
import { ContentGenerationProgress } from "@/components/ContentGenerationProgress";
import { FreeTrialStatus } from "@/components/FreeTrialStatus";
import { SavedSessionsList } from "@/components/SavedSessionsList";
import { MessageSquare, FileText, Search, Building2, Sparkles, RotateCw, LogOut, User, ChevronDown, CreditCard, Shield } from "lucide-react";
import blogCheatKeyLogo from "@assets/Gemini_Generated_Image_4aroxj4aroxj4aro_1757661484778.png";
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
      // useLogout에서 이미 랜딩페이지(/)로 리다이렉트 처리됨
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
      {/* Header - floating sticky */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src={blogCheatKeyLogo}
                alt="블로그치트키 로고"
                className="w-9 h-9 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                블로그치트키
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-1" aria-label="메인 네비게이션">
              <button
                onClick={() => navigate('/history')}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
              >
                작성 내역
              </button>
            </nav>
            <div className="flex items-center gap-2">
              <PaymentModal>
                <Button variant="outline" size="sm" className="cursor-pointer hidden sm:flex">
                  <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                  구독하기
                </Button>
              </PaymentModal>

              {(project as any) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <span className="hidden sm:inline">새 프로젝트</span>
                </Button>
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2 cursor-pointer">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground hidden sm:block max-w-[80px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate max-w-[140px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/subscribe")} className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                      구독하기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/history")} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                      작성 내역
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                        관리자 페이지
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
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
        {/* Progress Section */}
        <div className="mb-8 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">프로젝트 진행 상황</h2>
            {(project as any) && (
              <Badge variant="secondary" className="font-normal text-xs">
                {(project as any).keyword}
              </Badge>
            )}
          </div>
          <Progress value={(project as any) ? getProgressPercentage() : 0} className="mb-4 h-1.5" />
          <ProgressStepper currentStep={(project as any) ? getCurrentStepIndex() : 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Free Trial Status */}
            <FreeTrialStatus />

            {/* Keyword Analysis Form */}
            <KeywordAnalysisForm 
              onProjectCreated={(newProject) => {
                navigate(`/project/${newProject.id}`);
              }}
              project={project}
              onRefresh={refetch}
            />

            {/* Required Items Check */}
            <RequiredItemsCheck project={project} />

            {/* Saved Sessions List - Show when no project is selected */}
            {!project && (
              <SavedSessionsList 
                onSessionSelect={(sessionId) => {
                  // 세션 로드 API 호출 후 프로젝트로 이동
                  fetch(`/api/sessions/${sessionId}/load`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ createNew: true })
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.project?.id) {
                        navigate(`/project/${data.project.id}`);
                        toast({
                          title: "세션 불러오기 완료",
                          description: "저장된 세션을 불러왔습니다.",
                        });
                      } else if (data.error) {
                        toast({
                          title: "오류",
                          description: data.error,
                          variant: "destructive",
                        });
                      }
                    })
                    .catch(err => {
                      console.error(err);
                      toast({
                        title: "오류",
                        description: "세션을 불러오는데 실패했습니다.",
                        variant: "destructive",
                      });
                    });
                }}
              />
            )}
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




            {/* Reference Blog Links Form - Show after business info */}
            {(project as any) && ((project as any).status === 'business_info' || (project as any).status === 'content_generation' || (project as any).status === 'completed') && (
              <ReferenceBlogLinksForm 
                project={project as any} 
                onRefresh={refetch}
              />
            )}



            {/* Content Generation Progress */}
            <ContentGenerationProgress project={project as any} />

            {/* Blog Content Display */}
            {project && (project as any).generatedContent && (
              <BlogContentDisplay 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Session Manager - Show when project exists */}
            {project && (
              <SessionManager 
                currentProjectId={(project as any).id}
                onSessionLoaded={(newProjectId) => {
                  navigate(`/project/${newProjectId}`);
                }}
              />
            )}

            {/* Editing Chat - Moved above Infographic Gallery */}
            {project && (project as any).status === 'completed' && (
              <EditingChat 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Infographic Gallery */}
            {project && (project as any).generatedImages && (
              <InfographicGallery 
                project={project as any} 
                onRefresh={refetch}
              />
            )}

            {/* Reference Links */}
            {project && (project as any).researchData?.citations && (
              <ReferenceLinks 
                links={(project as any).researchData.citations} 
                citationsWithTitles={(project as any).researchData.citationsWithTitles} 
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
