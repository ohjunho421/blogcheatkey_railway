import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Bot, User } from "lucide-react";

interface EditingChatProps {
  project: any;
  onRefresh: () => void;
}

export function EditingChat({ project, onRefresh }: EditingChatProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // 텍스트 가독성 향상을 위한 줄바꿈 함수
  const formatTextForReadability = (text: string) => {
    if (!text) return text;
    
    // 긴 문장을 적절히 줄바꿈
    return text
      .split('\n')
      .map(paragraph => {
        if (paragraph.length <= 80) return paragraph;
        
        // 문장 단위로 분리 (.!?로 끝나는 부분)
        const sentences = paragraph.split(/([.!?]\s+)/).filter(Boolean);
        let result = '';
        let currentLine = '';
        
        for (let i = 0; i < sentences.length; i += 2) {
          const sentence = sentences[i] + (sentences[i + 1] || '');
          
          if (currentLine.length + sentence.length > 80 && currentLine.length > 0) {
            result += currentLine.trim() + '\n';
            currentLine = sentence;
          } else {
            currentLine += sentence;
          }
        }
        
        if (currentLine.trim()) {
          result += currentLine.trim();
        }
        
        return result;
      })
      .join('\n');
  };

  const { data: chatMessages, refetch: refetchChat } = useQuery({
    queryKey: ['/api/projects', project.id, 'chat'],
    enabled: !!project.id,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { message: string }) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/chat`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      refetchChat();
      
      if (data.type === 'external_tool_guide') {
        toast({
          title: "외부 도구 안내",
          description: "이미지 생성은 Google Whisk나 Napkin AI를 사용해주세요.",
        });
      } else if (data.type === 'title') {
        toast({
          title: "제목 생성 완료",
          description: "10가지 유형별 제목을 생성했습니다.",
        });
      } else if (data.type === 'edit') {
        onRefresh();
        toast({
          title: "수정 완료",
          description: "콘텐츠가 수정되었습니다.",
        });
      } else if (data.type === 'rate_limit') {
        toast({
          title: "요청 제한",
          description: data.message,
          variant: "destructive",
        });
      } else if (data.type === 'error') {
        toast({
          title: "이미지 생성 실패",
          description: "이미지 생성에 실패했습니다. 할당량 문제일 수 있습니다.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "처리 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ message: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="h-5 w-5 text-primary mr-2" />
          Gemini 수정 챗봇
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-80 w-full rounded-lg border p-4">
            {chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0 ? (
              <div className="space-y-3">
                {(chatMessages as any[]).map((msg: any) => (
                  <div key={msg.id} className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Bot className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.role === 'user' ? '사용자' : 'Gemini'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-line">
                        {formatTextForReadability(msg.content)}
                      </div>
                      {msg.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={msg.imageUrl} 
                            alt="Generated image"
                            className="max-w-full h-auto rounded-lg border shadow-sm"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  콘텐츠 수정 요청을 입력하거나<br/>
                  "제목 만들어줘"라고 말하면 10가지 유형별 제목을 생성합니다.<br/>
                  <span className="text-xs">이미지 생성은 Google Whisk/Napkin AI를 사용해주세요.</span>
                </p>
              </div>
            )}
          </ScrollArea>

          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 두 번째 단락을 더 자세히 설명해주세요 또는 제목 만들어줘"
              disabled={sendMessage.isPending}
            />
            <Button 
              onClick={handleSend}
              disabled={sendMessage.isPending || !message.trim()}
            >
              {sendMessage.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
