import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Copy, Smartphone, CheckCircle2, AlertCircle, Download, Image } from "lucide-react";

interface BlogContentDisplayProps {
  project: any;
  onRefresh: () => void;
}

export function BlogContentDisplay({ project, onRefresh }: BlogContentDisplayProps) {
  const [copyFormat, setCopyFormat] = useState<'normal' | 'mobile'>('normal');
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

  const handleCopy = (format: 'normal' | 'mobile') => {
    setCopyFormat(format);
    copyContent.mutate(format);
  };

  const handleImageDownload = async (imageIndex: number) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/images/${imageIndex}`);
      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infographic-${project.keyword}-${imageIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "다운로드 완료",
        description: "인포그래픽이 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "이미지 다운로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const renderSEOStatus = () => {
    if (!project.seoMetrics) return null;

    const { isOptimized, keywordFrequency, characterCount } = project.seoMetrics;

    return (
      <div className={`rounded-lg p-4 mb-4 border-l-4 ${
        isOptimized 
          ? 'bg-green-50 dark:bg-green-950 border-accent' 
          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOptimized ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium text-foreground">
              {isOptimized ? 'SEO 최적화 완료' : 'SEO 최적화 필요'}
            </span>
          </div>
          <div className="flex space-x-4 text-sm">
            <Badge variant="secondary">
              키워드 출현: {keywordFrequency}회
            </Badge>
            <Badge variant="secondary">
              글자수: {characterCount.toLocaleString()}자
            </Badge>
            <Badge variant="secondary">
              구조: 완료
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!project.generatedContent) return null;

    const sections = project.generatedContent.split('\n\n');
    
    return (
      <div className="prose max-w-none">
        {sections.map((section, index) => {
          if (section.startsWith('# ')) {
            return (
              <div key={index} className="border-l-4 border-blue-500 pl-4 mb-6">
                <h3 className="text-lg font-semibold mb-2">{section.replace('# ', '')}</h3>
              </div>
            );
          } else if (section.startsWith('## ')) {
            return (
              <div key={index} className="bg-muted rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">{section.replace('## ', '')}</h4>
              </div>
            );
          } else if (section.trim()) {
            return (
              <div key={index} className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {section}
                </p>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 text-primary mr-2" />
              생성된 블로그 글
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopy('normal')}
                disabled={copyContent.isPending}
              >
                <Copy className="h-4 w-4 mr-1" />
                일반 복사
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopy('mobile')}
                disabled={copyContent.isPending}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                모바일 복사
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderSEOStatus()}
          {renderContent()}
        </CardContent>
      </Card>

      {/* Generated Infographics */}
      {project.generatedImages && project.generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Image className="h-5 w-5 text-primary mr-2" />
              생성된 인포그래픽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.generatedImages.map((imageUrl: string, index: number) => (
                <div key={index} className="border rounded-lg overflow-hidden bg-muted">
                  <div className="aspect-square relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`인포그래픽 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl6nrprw8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground">이미지 생성 실패</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {project.subtitles?.[index] || `인포그래픽 ${index + 1}`}
                      </span>
                      {imageUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImageDownload(index)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          다운로드
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
