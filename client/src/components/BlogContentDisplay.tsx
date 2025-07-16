import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Copy, Smartphone, CheckCircle2, AlertCircle, Download, ImageIcon, Camera, RefreshCw, Eye, EyeOff } from "lucide-react";

interface BlogContentDisplayProps {
  project: any;
  onRefresh: () => void;
}

export function BlogContentDisplay({ project, onRefresh }: BlogContentDisplayProps) {
  const [copyFormat, setCopyFormat] = useState<'normal' | 'mobile'>('normal');
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const [generatingImages, setGeneratingImages] = useState<{[key: string]: boolean}>({});
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [mobilePreviewContent, setMobilePreviewContent] = useState<string>('');
  const { toast } = useToast();

  const copyContent = useMutation({
    mutationFn: async (format: 'normal' | 'mobile') => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/copy`, { format });
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.content);
      toast({
        title: "복사 완료",
        description: `${copyFormat === 'mobile' ? '모바일' : '일반'} 형식으로 복사되었습니다.`,
      });
    },
    onError: (error) => {
      toast({
        title: "복사 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateImage = useMutation({
    mutationFn: async ({ subtitle, type }: { subtitle: string; type: 'infographic' | 'photo' }) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/generate-image`, { subtitle, type });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const key = `${variables.subtitle}-${variables.type}`;
      setGeneratedImages(prev => ({ ...prev, [key]: data.imageUrl }));
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
      toast({
        title: "이미지 생성 완료",
        description: `${variables.type === 'infographic' ? '인포그래픽' : '사진'}이 생성되었습니다.`,
      });
    },
    onError: (error, variables) => {
      const key = `${variables.subtitle}-${variables.type}`;
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
      toast({
        title: "이미지 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleGenerateImage = (subtitle: string, type: 'infographic' | 'photo') => {
    const key = `${subtitle}-${type}`;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));
    generateImage.mutate({ subtitle, type });
  };

  const handleImageDownload = async (imageUrl: string, subtitle: string, type: string) => {
    try {
      const filename = `${type}-${project.keyword}-${subtitle.replace(/\s+/g, '-')}.png`;
      const downloadUrl = `/api/projects/${project.id}/download-image?imageUrl=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "다운로드 완료",
        description: "이미지가 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "이미지 다운로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (!project.generatedContent) {
    return null;
  }

  // Extract subtitles from project for image generation
  const subtitles = project.subtitles || [];

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

            {/* 생성된 콘텐츠 */}
            <div className="max-w-none">
              <div className="bg-background p-4 md:p-6 rounded-lg border">
                <div className="text-sm md:text-base leading-relaxed font-normal text-gray-800 dark:text-gray-200" 
                     style={{ lineHeight: '1.8' }}>
                  {project.generatedContent.split('\n').map((line, index) => (
                    <div key={index} className={`
                      ${line.trim() === '' ? 'mb-3 md:mb-4' : 'mb-1 md:mb-2'}
                      break-words
                    `}>
                      {line || '\u00A0'}
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

      {/* 소제목별 이미지 생성 */}
      {subtitles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ImageIcon className="h-5 w-5 text-primary mr-2" />
              소제목별 이미지 생성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subtitles.map((subtitle: string, index: number) => {
                const infographicKey = `${subtitle}-infographic`;
                const photoKey = `${subtitle}-photo`;
                const infographicUrl = generatedImages[infographicKey];
                const photoUrl = generatedImages[photoKey];
                const isGeneratingInfographic = generatingImages[infographicKey];
                const isGeneratingPhoto = generatingImages[photoKey];

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{index + 1}. {subtitle}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 인포그래픽 섹션 */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateImage(subtitle, 'infographic')}
                            disabled={isGeneratingInfographic}
                            variant="outline"
                          >
                            {isGeneratingInfographic ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                생성 중...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-4 w-4 mr-1" />
                                인포그래픽 생성
                              </>
                            )}
                          </Button>
                          {infographicUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageDownload(infographicUrl, subtitle, 'infographic')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              다운로드
                            </Button>
                          )}
                        </div>
                        {infographicUrl && (
                          <img 
                            src={infographicUrl} 
                            alt={`${subtitle} 인포그래픽`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        )}
                      </div>

                      {/* 사진 섹션 */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateImage(subtitle, 'photo')}
                            disabled={isGeneratingPhoto}
                            variant="outline"
                          >
                            {isGeneratingPhoto ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                생성 중...
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-1" />
                                사진 생성
                              </>
                            )}
                          </Button>
                          {photoUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageDownload(photoUrl, subtitle, 'photo')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              다운로드
                            </Button>
                          )}
                        </div>
                        {photoUrl && (
                          <img 
                            src={photoUrl} 
                            alt={`${subtitle} 사진`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}