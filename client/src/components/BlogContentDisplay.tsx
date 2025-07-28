import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Copy, Smartphone, CheckCircle2, AlertCircle, Download, ImageIcon, Camera, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";

interface BlogContentDisplayProps {
  project: any;
  onRefresh: () => void;
}

export function BlogContentDisplay({ project, onRefresh }: BlogContentDisplayProps) {
  const [copyFormat, setCopyFormat] = useState<'normal' | 'mobile'>('normal');
  // Removed image generation state - now using external tools
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [mobilePreviewContent, setMobilePreviewContent] = useState<string>('');
  const { toast } = useToast();

  const copyContent = useMutation({
    mutationFn: async (format: 'normal' | 'mobile') => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/copy`, { format });
      return response.json();
    },
    onSuccess: async (data) => {
      try {
        // Check if clipboard API is available and document is focused
        if (navigator.clipboard && document.hasFocus()) {
          await navigator.clipboard.writeText(data.content);
          toast({
            title: "복사 완료",
            description: `${copyFormat === 'mobile' ? '모바일' : '일반'} 형식으로 복사되었습니다.`,
          });
        } else {
          // Fallback: Create a temporary textarea element
          const textarea = document.createElement('textarea');
          textarea.value = data.content;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          
          try {
            document.execCommand('copy');
            toast({
              title: "복사 완료",
              description: `${copyFormat === 'mobile' ? '모바일' : '일반'} 형식으로 복사되었습니다.`,
            });
          } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            toast({
              title: "복사 실패",
              description: "브라우저에서 클립보드 접근이 제한되었습니다. 텍스트를 수동으로 선택해서 복사해주세요.",
              variant: "destructive",
            });
          } finally {
            document.body.removeChild(textarea);
          }
        }
      } catch (error) {
        console.error('Copy operation failed:', error);
        toast({
          title: "복사 실패",
          description: "클립보드에 복사하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "복사 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // External image generation handlers
  const handleOpenWhisk = () => {
    window.open('https://labs.google/fx/ko/tools/whisk', '_blank');
    toast({
      title: "Google Whisk 열기",
      description: "새 탭에서 Google Whisk로 이동했습니다.",
    });
  };

  const handleOpenNapkin = () => {
    window.open('https://www.napkin.ai/', '_blank');
    toast({
      title: "Napkin AI 열기", 
      description: "새 탭에서 Napkin AI로 이동했습니다.",
    });
  };

  const handleCopy = (format: 'normal' | 'mobile') => {
    setCopyFormat(format);
    copyContent.mutate(format);
  };

  const regenerateContent = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/regenerate`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "재생성 완료",
        description: "새로운 콘텐츠가 생성되었습니다.",
      });
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "재생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegenerate = () => {
    regenerateContent.mutate();
  };

  const toggleMobilePreview = async () => {
    if (!showMobilePreview && !mobilePreviewContent) {
      try {
        const response = await apiRequest("POST", `/api/projects/${project.id}/copy`, { format: 'mobile' });
        const data = await response.json();
        setMobilePreviewContent(data.content);
      } catch (error) {
        toast({
          title: "미리보기 실패",
          description: "모바일 미리보기를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        return;
      }
    }
    setShowMobilePreview(!showMobilePreview);
  };

  // Removed image generation functionality - now using external tools

  const parseContentSections = (content: string) => {
    if (!content) return [];
    
    const sections = content.split('\n\n').filter(section => section.trim());
    const parsedSections: { type: 'title' | 'subtitle' | 'paragraph', text: string, isMainSubtitle?: boolean }[] = [];
    
    sections.forEach(section => {
      const trimmedSection = section.trim();
      
      // Check if it's a main subtitle (from the analysis subtitles)
      const isMainSubtitle = project.subtitles && 
        project.subtitles.some((subtitle: string) => 
          trimmedSection.includes(subtitle) || subtitle.includes(trimmedSection.slice(0, 20))
        );
      
      if (trimmedSection.length < 100 && !trimmedSection.includes('.') && !trimmedSection.includes('?')) {
        // It's likely a title or subtitle
        parsedSections.push({ 
          type: isMainSubtitle ? 'subtitle' : 'title', 
          text: trimmedSection,
          isMainSubtitle 
        });
      } else {
        // It's a paragraph
        parsedSections.push({ type: 'paragraph', text: trimmedSection });
      }
    });
    
    return parsedSections;
  };

  // Extract subtitles for image generation tools
  const subtitles = project.subtitles || [];

  if (!project.generatedContent) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 생성된 블로그 콘텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-2" />
              생성된 블로그 콘텐츠
            </div>
            <div className="flex items-center space-x-2">
              {project.seoMetrics && (
                <Badge variant={project.seoMetrics.isOptimized ? "default" : "secondary"}>
                  {project.seoMetrics.isOptimized ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      SEO 최적화 완료
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      SEO 개선 필요
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* SEO 분석 결과 */}
            {project.seoMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{project.seoMetrics.keywordFrequency}</div>
                  <div className="text-sm text-muted-foreground">키워드 출현 횟수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{project.seoMetrics.characterCount}</div>
                  <div className="text-sm text-muted-foreground">글자수 (공백제외)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{project.seoMetrics.morphemeCount}</div>
                  <div className="text-sm text-muted-foreground">형태소 개수</div>
                </div>
              </div>
            )}

            {/* 생성된 콘텐츠 with Interactive Image Generation */}
            <div className="max-w-none">
              <div className="bg-background p-4 md:p-6 rounded-lg border">
                <div className="text-sm md:text-base leading-relaxed font-normal text-gray-800 dark:text-gray-200" 
                     style={{ lineHeight: '1.8' }}>
                  {parseContentSections(project.generatedContent).map((section, index) => (
                    <div key={index} className="relative group">
                      {section.type === 'subtitle' && section.isMainSubtitle ? (
                        <div className="mb-4">
                          <div className="font-semibold text-lg mb-2">
                            {section.text}
                          </div>
                        </div>
                      ) : section.type === 'title' ? (
                        <div className="font-bold text-xl mb-3">
                          {section.text}
                        </div>
                      ) : (
                        <div className="mb-2 break-words">
                          {section.text || '\u00A0'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 복사 및 재생성 버튼들 */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                <Button 
                  onClick={() => handleCopy('normal')}
                  disabled={copyContent.isPending}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {copyContent.isPending && copyFormat === 'normal' ? (
                    "복사 중..."
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      일반 복사 (PC용)
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleCopy('mobile')}
                  disabled={copyContent.isPending}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {copyContent.isPending && copyFormat === 'mobile' ? (
                    "복사 중..."
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      모바일 복사 (짧은 줄바꿈)
                    </>
                  )}
                </Button>
                <Button 
                  onClick={toggleMobilePreview}
                  variant="ghost"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {showMobilePreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      미리보기 닫기
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      모바일 미리보기
                    </>
                  )}
                </Button>
              </div>
              
              {/* 재생성 버튼 */}
              <div className="flex justify-center pt-2">
                <Button 
                  onClick={handleRegenerate}
                  disabled={regenerateContent.isPending}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {regenerateContent.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      콘텐츠 재생성 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      다시 생성 (완전히 새로운 콘텐츠)
                    </>
                  )}
                </Button>
              </div>

              {/* 모바일 미리보기 */}
              {showMobilePreview && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                  <div className="flex items-center mb-3">
                    <Smartphone className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      모바일 화면 미리보기 (30자 줄바꿈)
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border max-w-xs mx-auto">
                    <div className="text-xs leading-relaxed font-normal text-gray-800 dark:text-gray-200" 
                         style={{ lineHeight: '1.6' }}>
                      {mobilePreviewContent.split('\n').map((line, index) => (
                        <div key={index} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 외부 이미지 생성 도구 */}
      {subtitles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ImageIcon className="h-5 w-5 text-primary mr-2" />
              이미지 생성 도구
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              소제목별로 이미지나 인포그래픽을 생성하려면 아래 외부 도구를 사용해주세요
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 이미지 생성하러 가기 버튼 */}
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={handleOpenWhisk}
                >
                  <div className="flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-lg">이미지 생성하러 가기</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Google Whisk에서 AI 이미지를 생성하세요<br/>
                    소제목에 맞는 이미지를 만들 수 있습니다
                  </p>
                </Button>

                {/* 인포그래픽 생성하러 가기 버튼 */}
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={handleOpenNapkin}
                >
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-lg">인포그래픽 생성하러 가기</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Napkin AI에서 인포그래픽을 생성하세요<br/>
                    데이터 시각화와 설명 그래픽을 만들 수 있습니다
                  </p>
                </Button>
              </div>

              {/* 소제목 목록 표시 */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h5 className="font-medium mb-2 text-sm text-muted-foreground">📝 생성된 소제목들:</h5>
                <div className="space-y-1">
                  {subtitles.map((subtitle: string, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="text-muted-foreground">{index + 1}.</span> {subtitle}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}