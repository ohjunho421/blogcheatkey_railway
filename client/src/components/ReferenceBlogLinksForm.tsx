import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ExternalLink, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ReferenceBlogLink } from "@shared/schema";

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
      </CardContent>
    </Card>
  );
}