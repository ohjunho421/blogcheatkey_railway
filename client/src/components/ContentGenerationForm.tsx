import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, ArrowRight, RefreshCw, Lightbulb } from "lucide-react";

interface ContentGenerationFormProps {
  project: any;
  onRefresh: () => void;
}

export function ContentGenerationForm({ project, onRefresh }: ContentGenerationFormProps) {
  const [customMorphemes, setCustomMorphemes] = useState(project.customMorphemes || "");
  const { toast } = useToast();

  // Save custom morphemes
  const saveCustomMorphemes = useMutation({
    mutationFn: async (morphemes: string) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/custom-morphemes`, {
        customMorphemes: morphemes
      });
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "추가형태소 저장 완료",
        description: "사용자 정의 형태소가 저장되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate blog content
  const generateContent = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/generate`, {});
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "블로그 생성 완료",
        description: "SEO 최적화된 블로그가 생성되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveCustomMorphemes = () => {
    saveCustomMorphemes.mutate(customMorphemes);
  };

  const handleGenerate = () => {
    generateContent.mutate();
  };

  if (project.status !== 'content_generation' && project.status !== 'completed') {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="h-5 w-5 text-primary mr-2" />
            추가 형태소 (선택사항)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-morphemes">블로그에 포함하고 싶은 단어들</Label>
              <Input
                id="custom-morphemes"
                value={customMorphemes}
                onChange={(e) => setCustomMorphemes(e.target.value)}
                placeholder="예: 품질보증 고객만족 전문기술 (공백으로 구분)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                블로그에 반드시 포함하고 싶은 단어들을 공백으로 구분해서 입력하세요
              </p>
            </div>

            <Button
              onClick={handleSaveCustomMorphemes}
              disabled={saveCustomMorphemes.isPending}
              variant="outline"
              size="sm"
            >
              {saveCustomMorphemes.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "추가형태소 저장"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileText className="h-5 w-5 text-primary mr-2" />
            블로그 생성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">SEO 최적화 조건</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 키워드 "{project.keyword}" 5-7회 포함</li>
                <li>• 키워드 구성요소 각각 15-17회 포함</li>
                <li>• 총 1500-1700자 (공백 제외)</li>
                <li>• 서론 35-40% 비중</li>
                <li>• 자연스러운 블로그 톤앤매너</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateContent.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {generateContent.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Claude AI로 블로그 생성 중...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {project.status === 'completed' ? '블로그 재생성' : 'SEO 블로그 생성하기'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}