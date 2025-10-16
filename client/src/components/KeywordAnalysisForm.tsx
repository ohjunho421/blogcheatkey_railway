import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Brain, Lightbulb, GripVertical, Sparkles, Edit, Trash, Check, X, Plus, Save } from "lucide-react";
import { useLocation } from "wouter";

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
  const [, navigate] = useLocation();

  const createProjectAndAnalyze = useMutation({
    mutationFn: async (data: { keyword: string }) => {
      // 프로젝트 생성
      const createResponse = await apiRequest("POST", "/api/projects", data);
      const newProject = await createResponse.json();
      
      // 키워드 분석만 진행 (자료 수집은 수동)
      const analyzeResponse = await apiRequest("POST", `/api/projects/${newProject.id}/analyze`, {});
      const analysisResult = await analyzeResponse.json();
      
      return analysisResult;
    },
    onSuccess: (data) => {
      onProjectCreated(data);
      toast({
        title: "키워드 분석 완료",
        description: "소제목을 확인하고 '자료 수집' 버튼을 클릭해주세요.",
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
      // 키워드 분석만 진행
      const analyzeResponse = await apiRequest("POST", `/api/projects/${id}/analyze`, {});
      const analysisResult = await analyzeResponse.json();
      
      return analysisResult;
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "키워드 분석 완료",
        description: "소제목을 확인하고 '자료 수집' 버튼을 클릭해주세요.",
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
    createProjectAndAnalyze.mutate({ keyword: keyword.trim() });
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
    if (editedSubtitles.length > 0 && editedSubtitles.every(subtitle => subtitle.trim().length > 0)) {
      updateSubtitles.mutate({ subtitles: editedSubtitles });
      setEditingSubtitle(null);
    } else {
      toast({
        title: "수정 실패",
        description: "모든 소제목을 입력해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleResearch = () => {
    if (project) {
      researchData.mutate(project.id);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(project.subtitles || []) as string[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update subtitles immediately
    updateSubtitles.mutate({ subtitles: items });
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
            <Label htmlFor="keyword">블로그 주제 키워드 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                value={project ? project.keyword : keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 엔진오일교체, 자동차수리, 레스토랑창업"
                disabled={!!project}
                className="flex-1"
              />
              {project && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("키워드를 수정하면 현재 프로젝트가 초기화됩니다. 계속하시겠습니까?")) {
                      navigate("/");
                      window.location.reload();
                    }
                  }}
                  title="키워드 수정"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {!project && (
            <Button 
              onClick={handleCreateProject}
              disabled={createProjectAndAnalyze.isPending}
              className="w-full"
            >
              {createProjectAndAnalyze.isPending ? (
                <>키워드 분석 중...</>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  키워드 분석 시작
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
                <>키워드 분석 중...</>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  키워드 분석 시작
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
              <p className="text-sm text-muted-foreground break-keep leading-relaxed">
                {project.keywordAnalysis.searchIntent}
              </p>
            </div>

            {/* User Concerns */}
            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border-l-4 border-orange-500">
              <h3 className="font-semibold text-foreground mb-2">사용자 고민사항</h3>
              <p className="text-sm text-muted-foreground break-keep leading-relaxed">
                {project.keywordAnalysis.userConcerns}
              </p>
            </div>

            {/* Suggested Subtitles */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-accent">
              <h3 className="font-semibold text-foreground mb-3">추천 소제목</h3>
              <p className="text-xs text-muted-foreground mb-3">
                드래그앤드롭으로 순서를 변경할 수 있습니다
              </p>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="subtitles" type="SUBTITLE">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 min-h-[100px]"
                    >
                      {project.subtitles?.map((subtitle: string, index: number) => (
                        <Draggable 
                          key={`subtitle-${subtitle}-${index}`} 
                          draggableId={`subtitle-${subtitle}-${index}`} 
                          index={index}
                          isDragDisabled={editingSubtitle === index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 bg-card rounded border transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'bg-primary/10 border-primary shadow-lg transform rotate-2' 
                                  : 'hover:bg-muted/50 hover:shadow-sm'
                              }`}
                            >
                              {editingSubtitle === index ? (
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mr-3 p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-colors"
                                      title="드래그하여 순서 변경"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Textarea
                                      value={editedSubtitles[index] || subtitle}
                                      onChange={(e) => handleSubtitleEdit(index, e.target.value)}
                                      className="flex-1"
                                      rows={2}
                                      placeholder="소제목을 입력하세요"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveSubtitles}
                                      disabled={updateSubtitles.isPending}
                                    >
                                      {updateSubtitles.isPending ? "저장 중..." : "저장"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingSubtitle(null);
                                        setEditedSubtitles([]);
                                      }}
                                      disabled={updateSubtitles.isPending}
                                    >
                                      취소
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mr-3 p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-colors"
                                      title="드래그하여 순서 변경"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm flex-1">{index + 1}. {subtitle}</span>
                                  </div>
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
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Research Data Collection Button */}
            {(project.status === 'keyword_analysis' || project.status === 'data_collection') && (
              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={() => researchData.mutate(project.id)}
                  disabled={researchData.isPending}
                  className="w-full"
                  size="default"
                >
                  {researchData.isPending ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      퍼플렉시티 자료 수집 중...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      퍼플렉시티 자료 수집하기
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Perplexity AI로 관련 정보를 수집합니다
                </p>
              </div>
            )}

            {project.status === 'business_info' && (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">
                  ✅ 키워드 분석 및 자료 수집이 완료되었습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  이제 업체 정보를 입력해주세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
