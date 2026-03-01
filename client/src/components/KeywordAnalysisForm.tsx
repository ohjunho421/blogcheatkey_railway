import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Brain, Lightbulb, GripVertical, Edit, Trash, Check, X, Plus, Save, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { ArticleDirectionSelector } from "./ArticleDirectionSelector";
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
  const [isEditingIntent, setIsEditingIntent] = useState(false);
  const [isEditingConcerns, setIsEditingConcerns] = useState(false);
  const [editedIntent, setEditedIntent] = useState("");
  const [editedConcerns, setEditedConcerns] = useState("");
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

  const updateKeywordAnalysis = useMutation({
    mutationFn: async ({ searchIntent, userConcerns }: { searchIntent?: string; userConcerns?: string }) => {
      const response = await apiRequest("PUT", `/api/projects/${project.id}/keyword-analysis`, {
        searchIntent,
        userConcerns
      });
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      setIsEditingIntent(false);
      setIsEditingConcerns(false);
      toast({
        title: "저장 완료",
        description: "키워드 분석이 업데이트되었습니다.",
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

  const regenerateSubtitles = useMutation({
    mutationFn: async (id: number) => {
      const analyzeResponse = await apiRequest("POST", `/api/projects/${id}/analyze`, {});
      return analyzeResponse.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "소제목 재생성 완료",
        description: "새로운 소제목이 생성되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "재생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeWithDirection = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: string | null }) => {
      const analyzeResponse = await apiRequest("POST", `/api/projects/${id}/analyze`, {
        direction: direction || undefined,
      });
      return analyzeResponse.json();
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
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <span className="text-sm font-medium text-muted-foreground">1단계: 키워드 분석</span>
          </div>
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
                  <Edit className="h-4 w-4" />
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">사용자가 검색하는 이유</h3>
                {!isEditingIntent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingIntent(true);
                      setEditedIntent(project.keywordAnalysis.searchIntent);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                )}
              </div>
              {isEditingIntent ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedIntent}
                    onChange={(e) => setEditedIntent(e.target.value)}
                    className="text-sm min-h-[100px]"
                    placeholder="검색 의도를 입력하세요..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateKeywordAnalysis.mutate({ searchIntent: editedIntent })}
                      disabled={updateKeywordAnalysis.isPending}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingIntent(false);
                        setEditedIntent("");
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground break-keep leading-relaxed">
                  {project.keywordAnalysis.searchIntent}
                </p>
              )}
            </div>

            {/* User Concerns */}
            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">사용자가 해결하고 싶은 문제</h3>
                {!isEditingConcerns && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingConcerns(true);
                      setEditedConcerns(project.keywordAnalysis.userConcerns);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                )}
              </div>
              {isEditingConcerns ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedConcerns}
                    onChange={(e) => setEditedConcerns(e.target.value)}
                    className="text-sm min-h-[100px]"
                    placeholder="사용자 고민사항을 입력하세요..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateKeywordAnalysis.mutate({ userConcerns: editedConcerns })}
                      disabled={updateKeywordAnalysis.isPending}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingConcerns(false);
                        setEditedConcerns("");
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground break-keep leading-relaxed">
                  {project.keywordAnalysis.userConcerns}
                </p>
              )}
            </div>

            {/* Suggested Subtitles */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-accent">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">추천 소제목</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regenerateSubtitles.mutate(project.id)}
                  disabled={regenerateSubtitles.isPending}
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  {regenerateSubtitles.isPending ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      생성중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      다시 추천
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                <GripVertical className="h-3 w-3" />
                드래그로 소제목 순서를 변경할 수 있습니다
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
                                    <Edit className="h-4 w-4" />
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

            {project.status === 'business_info' && (
              <div className="flex flex-col items-center gap-1 py-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-600 font-medium">
                  키워드 분석 및 자료 수집이 완료되었습니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  이제 업체 정보를 입력해주세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 자료 수집 카드 — 분석 완료 후 별도 단계로 분리 */}
      {project && project.keywordAnalysis && (project.status === 'keyword_analysis' || project.status === 'data_collection') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="h-5 w-5 text-primary mr-2" />
              자료 수집
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
              <span className="text-sm font-medium text-muted-foreground">2단계: 글 방향 설정 후 자료 수집</span>
            </div>

            <ArticleDirectionSelector
              keyword={project.keyword}
              isLoading={analyzeWithDirection.isPending || researchData.isPending}
              onConfirm={async (direction) => {
                try {
                  // 방향이 있으면 재분석 (소제목 재생성), 없으면 바로 수집
                  if (direction) {
                    await analyzeWithDirection.mutateAsync({ id: project.id, direction });
                    onRefresh();
                    toast({
                      title: "소제목 재생성 완료",
                      description: "방향을 반영한 소제목으로 자료를 수집합니다.",
                    });
                  }
                  researchData.mutate(project.id);
                } catch {
                  toast({
                    title: "오류",
                    description: "소제목 재생성에 실패했습니다.",
                    variant: "destructive",
                  });
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
