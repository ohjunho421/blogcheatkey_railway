import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Brain, Edit2, ArrowRight } from "lucide-react";

interface KeywordAnalysisFormProps {
  onProjectCreated: (project: any) => void;
  project?: any;
  onRefresh: () => void;
}

export function KeywordAnalysisForm({ onProjectCreated, project, onRefresh }: KeywordAnalysisFormProps) {
  const [keyword, setKeyword] = useState("");
  const [editingSubtitle, setEditingSubtitle] = useState<number | null>(null);
  const [editedSubtitles, setEditedSubtitles] = useState<string[]>([]);
  const { toast } = useToast();

  const createProject = useMutation({
    mutationFn: async (data: { keyword: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (data) => {
      onProjectCreated(data);
      toast({
        title: "프로젝트 생성 완료",
        description: "키워드 분석을 시작하세요.",
      });
    },
    onError: (error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeKeyword = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/projects/${id}/analyze`, {});
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "키워드 분석 완료",
        description: "소제목을 확인하고 수정하세요.",
      });
    },
    onError: (error) => {
      toast({
        title: "분석 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSubtitles = useMutation({
    mutationFn: async (data: { subtitles: string[] }) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/subtitles`, data);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "소제목 수정 완료",
        description: "자료 수집을 시작하세요.",
      });
    },
    onError: (error) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const researchData = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/projects/${id}/research`, {});
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "자료 수집 완료",
        description: "업체 정보를 입력하세요.",
      });
    },
    onError: (error) => {
      toast({
        title: "수집 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!keyword.trim()) {
      toast({
        title: "키워드 입력 필요",
        description: "블로그 주제 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createProject.mutate({ keyword: keyword.trim() });
  };

  const handleAnalyze = () => {
    if (project) {
      analyzeKeyword.mutate(project.id);
    }
  };

  const handleSubtitleEdit = (index: number, value: string) => {
    const newSubtitles = [...(project.subtitles || [])];
    newSubtitles[index] = value;
    setEditedSubtitles(newSubtitles);
  };

  const handleSaveSubtitles = () => {
    if (editedSubtitles.length === 4) {
      updateSubtitles.mutate({ subtitles: editedSubtitles });
      setEditingSubtitle(null);
    }
  };

  const handleResearch = () => {
    if (project) {
      researchData.mutate(project.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Keyword Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Search className="h-5 w-5 text-primary mr-2" />
            키워드 입력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="keyword">블로그 주제 키워드</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 엔진오일교체, 자동차수리, 레스토랑창업"
              disabled={!!project}
            />
          </div>
          {!project && (
            <Button 
              onClick={handleCreateProject}
              disabled={createProject.isPending}
              className="w-full"
            >
              {createProject.isPending ? (
                <>분석 준비 중...</>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  프로젝트 생성
                </>
              )}
            </Button>
          )}
          {project && project.status === 'keyword_analysis' && (
            <Button 
              onClick={handleAnalyze}
              disabled={analyzeKeyword.isPending}
              className="w-full"
            >
              {analyzeKeyword.isPending ? (
                <>Gemini 분석 중...</>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Gemini로 분석 시작
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Keyword Analysis Results */}
      {project && project.keywordAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Brain className="h-5 w-5 text-primary mr-2" />
              키워드 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Intent */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border-l-4 border-primary">
              <h3 className="font-semibold text-foreground mb-2">검색 의도 분석</h3>
              <p className="text-sm text-muted-foreground">
                {project.keywordAnalysis.searchIntent}
              </p>
            </div>

            {/* User Concerns */}
            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border-l-4 border-orange-500">
              <h3 className="font-semibold text-foreground mb-2">사용자 고민사항</h3>
              <p className="text-sm text-muted-foreground">
                {project.keywordAnalysis.userConcerns}
              </p>
            </div>

            {/* Suggested Subtitles */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-accent">
              <h3 className="font-semibold text-foreground mb-3">추천 소제목</h3>
              <div className="space-y-2">
                {project.subtitles?.map((subtitle: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-card rounded border">
                    {editingSubtitle === index ? (
                      <Textarea
                        value={editedSubtitles[index] || subtitle}
                        onChange={(e) => handleSubtitleEdit(index, e.target.value)}
                        className="flex-1 mr-2"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm flex-1">{index + 1}. {subtitle}</span>
                    )}
                    <div className="flex items-center space-x-2">
                      {editingSubtitle === index ? (
                        <Button
                          size="sm"
                          onClick={handleSaveSubtitles}
                          disabled={updateSubtitles.isPending}
                        >
                          저장
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubtitle(index);
                            setEditedSubtitles([...(project.subtitles || [])]);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {project.status === 'data_collection' && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleResearch}
                  disabled={researchData.isPending}
                  className="bg-accent hover:bg-accent/90"
                >
                  {researchData.isPending ? (
                    <>자료 수집 중...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Perplexity로 자료 수집
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
