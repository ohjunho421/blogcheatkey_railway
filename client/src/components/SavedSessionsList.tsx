import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Clock, FileText, ArrowRight, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProjectSession {
  id: number;
  sessionName: string;
  sessionDescription?: string;
  keyword: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedSessionsListProps {
  onSessionSelect: (projectId: number) => void;
}

export function SavedSessionsList({ onSessionSelect }: SavedSessionsListProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, error } = useQuery<ProjectSession[]>({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('세션 삭제에 실패했습니다');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "삭제 완료",
        description: "세션이 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    if (confirm('이 세션을 삭제하시겠습니까?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            저장된 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            저장된 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>저장된 세션이 없습니다.</p>
            <p className="text-sm mt-1">블로그 글을 작성하면 자동으로 저장됩니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          저장된 세션
          <Badge variant="secondary" className="ml-auto">
            {sessions.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="font-medium text-sm line-clamp-2 break-words">
                      {session.sessionName || session.keyword}
                    </h4>
                    <Badge variant="outline" className="text-xs mt-1 max-w-full truncate">
                      {session.keyword}
                    </Badge>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={deleteSessionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default SavedSessionsList;
