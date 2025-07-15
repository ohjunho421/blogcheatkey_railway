import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Image, Download, RefreshCw } from "lucide-react";

interface InfographicGalleryProps {
  project: any;
  onRefresh: () => void;
}

export function InfographicGallery({ project, onRefresh }: InfographicGalleryProps) {
  const { toast } = useToast();

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

  if (!project.generatedImages || project.generatedImages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Image className="h-5 w-5 text-primary mr-2" />
            생성된 인포그래픽
          </CardTitle>
          <Badge variant="secondary">
            {project.generatedImages.filter((img: string) => img).length}개 생성됨
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.generatedImages.map((imageUrl: string, index: number) => (
            <div key={index} className="border rounded-lg overflow-hidden bg-card">
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
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                      <span className="text-sm text-muted-foreground">생성 중...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">
                      {project.subtitles?.[index] || `인포그래픽 ${index + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      소제목 {index + 1}번 인포그래픽
                    </span>
                  </div>
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
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-muted-foreground">
            💡 <strong>사용 팁:</strong> 각 인포그래픽은 해당 소제목의 내용을 시각적으로 표현합니다. 
            블로그 글과 함께 사용하면 더욱 효과적입니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}