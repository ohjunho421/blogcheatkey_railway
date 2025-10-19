import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Save,
  FolderOpen,
  Trash2,
  Clock,
  FileText,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

interface SessionManagerProps {
  currentProjectId?: number;
  onSessionLoaded?: (projectId: number) => void;
}

export function SessionManager({ currentProjectId, onSessionLoaded }: SessionManagerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  // Fetch all sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  // Save current project as session
  const saveSession = useMutation({
    mutationFn: async (data: { sessionName: string; sessionDescription?: string }) => {
      if (!currentProjectId) {
        throw new Error("현재 프로젝트가 없습니다");
      }
      const response = await apiRequest("POST", `/api/projects/${currentProjectId}/sessions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setSaveDialogOpen(false);
      setSessionName("");
      setSessionDescription("");
      toast({
        title: "세션 저장 완료",
        description: "작성 내역이 저장되었습니다.",
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

  // Load session into new project
  const loadSession = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/load`, {
        createNew: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "세션 불러오기 완료",
        description: "이전 작성 내역을 불러왔습니다.",
      });
      
      // Navigate to the loaded project
      if (data.project?.id) {
        setLocation(`/project/${data.project.id}`);
        if (onSessionLoaded) {
          onSessionLoaded(data.project.id);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "불러오기 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("DELETE", `/api/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      toast({
        title: "세션 삭제 완료",
        description: "저장된 세션이 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!sessionName.trim()) {
      toast({
        title: "세션 이름 필요",
        description: "세션 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    saveSession.mutate({
      sessionName: sessionName.trim(),
      sessionDescription: sessionDescription.trim() || undefined,
    });
  };

  const handleDelete = (sessionId: number) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteSession.mutate(sessionToDelete);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              <FolderOpen className="h-5 w-5 text-primary mr-2" />
              세션 관리
            </CardTitle>
            <CardDescription>
              작성 내역을 저장하고 나중에 불러올 수 있습니다
            </CardDescription>
          </div>
          {currentProjectId && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  현재 작업 저장
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>세션 저장</DialogTitle>
                  <DialogDescription>
                    현재 작성 내역을 저장합니다. 나중에 불러와서 수정하거나 새 글을 작성할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-name">세션 이름 *</Label>
                    <Input
                      id="session-name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="예: 블로그 초안 v1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-desc">설명 (선택)</Label>
                    <Textarea
                      id="session-desc"
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      placeholder="이 세션에 대한 간단한 설명"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSave}
                    disabled={saveSession.isPending}
                  >
                    {saveSession.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    저장
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions && Array.isArray(sessions) && sessions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {(sessions as any[]).map((session: any) => (
                <Card key={session.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{session.sessionName}</h4>
                        </div>
                        {session.sessionDescription && (
                          <p className="text-sm text-muted-foreground">
                            {session.sessionDescription}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(session.createdAt).toLocaleString('ko-KR')}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {session.keyword}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadSession.mutate(session.id)}
                          disabled={loadSession.isPending}
                        >
                          {loadSession.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              저장된 세션이 없습니다.
              <br />
              현재 작업을 저장하여 나중에 불러올 수 있습니다.
            </p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
