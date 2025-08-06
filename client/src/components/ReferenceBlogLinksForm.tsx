import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ExternalLink, BookOpen, Hash, Save, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ReferenceBlogLink } from "@shared/schema";
import { GenerateBlogButton } from "@/components/GenerateBlogButton";

interface ReferenceBlogLinksFormProps {
  project: any;
  onRefresh: () => void;
}

const purposeLabels = {
  tone: "어투/톤",
  storytelling: "스토리텔링",
  hook: "서론 후킹",
  cta: "결론 CTA"
};

const purposeDescriptions = {
  tone: "글의 톤앤매너, 말투, 문체를 참고",
  storytelling: "스토리 구성, 전개 방식을 참고",
  hook: "독자의 관심을 끄는 서론 작성법 참고",
  cta: "강력한 행동 유도 결론 작성법 참고"
};

export function ReferenceBlogLinksForm({ project, onRefresh }: ReferenceBlogLinksFormProps) {
  const [newLink, setNewLink] = useState({
    url: "",
    purpose: "" as "tone" | "storytelling" | "hook" | "cta" | "",
    description: ""
  });
  const [customMorphemes, setCustomMorphemes] = useState(project?.customMorphemes || "");
  const { toast } = useToast();

  const existingLinks: ReferenceBlogLink[] = project?.referenceBlogLinks || [];

  const updateReferenceLinks = useMutation({
    mutationFn: async (links: ReferenceBlogLink[]) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/reference-links`, { links });
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "참고 링크 저장 완료",
        description: "참고 블로그 링크가 저장되었습니다.",
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

  const updateCustomMorphemes = useMutation({
    mutationFn: async (morphemes: string) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/custom-morphemes`, { 
        customMorphemes: morphemes 
      });
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "사용자 정의 형태소 저장 완료",
        description: "추가 형태소가 저장되었습니다.",
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

  const addLink = () => {
    if (!newLink.url || !newLink.purpose) {
      toast({
        title: "입력 오류",
        description: "URL과 목적을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(newLink.url); // URL 유효성 검사
    } catch {
      toast({
        title: "URL 오류",
        description: "올바른 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const updatedLinks = [...existingLinks, newLink as ReferenceBlogLink];
    updateReferenceLinks.mutate(updatedLinks);
    
    setNewLink({ url: "", purpose: "", description: "" });
  };

  const removeLink = (index: number) => {
    const updatedLinks = existingLinks.filter((_, i) => i !== index);
    updateReferenceLinks.mutate(updatedLinks);
  };

  const saveMorphemes = () => {
    updateCustomMorphemes.mutate(customMorphemes);
  };

  const parsedMorphemes = customMorphemes.trim() 
    ? customMorphemes.split(' ').filter((m: string) => m.trim().length > 0)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="h-5 w-5 text-primary mr-2" />
          참고 블로그 링크 (선택사항)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          글의 어투, 스토리텔링, 후킹 방법, CTA 스타일을 참고할 블로그 링크를 추가하세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 기존 링크 목록 */}
        {existingLinks.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">저장된 참고 링크</Label>
            {existingLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{purposeLabels[link.purpose]}</Badge>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      링크 열기
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                  {link.description && (
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 새 링크 추가 */}
        <div className="space-y-3 p-4 border rounded-lg">
          <Label className="text-sm font-medium">새 참고 링크 추가</Label>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="reference-url" className="text-sm">블로그 URL</Label>
              <Input
                id="reference-url"
                placeholder="https://example.com/blog-post"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="reference-purpose" className="text-sm">참고 목적</Label>
              <Select 
                value={newLink.purpose} 
                onValueChange={(value: "tone" | "storytelling" | "hook" | "cta") => 
                  setNewLink({ ...newLink, purpose: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="참고할 요소를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(purposeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">
                          {purposeDescriptions[key as keyof typeof purposeDescriptions]}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference-description" className="text-sm">메모 (선택사항)</Label>
              <Textarea
                id="reference-description"
                placeholder="이 링크에서 참고할 구체적인 부분을 메모하세요..."
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                rows={2}
              />
            </div>

            <Button 
              onClick={addLink}
              disabled={updateReferenceLinks.isPending || !newLink.url || !newLink.purpose}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              참고 링크 추가
            </Button>
          </div>
        </div>

        {existingLinks.length > 0 && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            💡 <strong>팁:</strong> 추가된 참고 링크는 블로그 생성 시 AI가 분석하여 해당 스타일을 반영합니다.
            여러 링크를 추가하면 다양한 요소를 종합적으로 참고합니다.
          </div>
        )}

        {/* 사용자 정의 형태소 입력 섹션 */}
        <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium">추가 형태소 (선택사항)</Label>
          </div>
          
          <p className="text-xs text-muted-foreground">
            글에 꼭 포함되었으면 하는 단어나 형태소를 띄어쓰기로 구분해서 입력하세요. 
            각 형태소는 블로그 생성 시 최소 1회씩 포함됩니다.
          </p>

          <div className="space-y-3">
            <Textarea
              placeholder="예: 전문가 신뢰성 효과적인 추천 만족도"
              value={customMorphemes}
              onChange={(e) => setCustomMorphemes(e.target.value)}
              rows={3}
              className="resize-none"
            />

            {parsedMorphemes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">인식된 형태소 ({parsedMorphemes.length}개)</Label>
                <div className="flex flex-wrap gap-1">
                  {parsedMorphemes.map((morpheme: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {morpheme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={saveMorphemes}
              disabled={updateCustomMorphemes.isPending}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              형태소 저장
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950 p-2 rounded">
            ⚡ <strong>활용 팁:</strong> 업체명, 전문용어, 강조하고 싶은 키워드 등을 추가하면 
            더욱 전문적이고 개성있는 블로그가 생성됩니다.
          </div>
        </div>

        {/* Blog Generation Button Section */}
        {project.status === 'business_info' && project.businessInfo && !project.generatedContent && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  모든 정보가 준비되었습니다!
                </h3>
                <p className="text-sm text-muted-foreground">
                  업체 정보, 참고 링크, 추가 형태소가 설정되었습니다.
                  <br />이제 SEO 최적화된 블로그를 생성해보세요.
                </p>
              </div>
              
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

              <GenerateBlogButton project={project} onRefresh={onRefresh} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}