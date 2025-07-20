import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";

interface GenerateBlogButtonProps {
  project: any;
  onRefresh: () => void;
}

export function GenerateBlogButton({ project, onRefresh }: GenerateBlogButtonProps) {
  const { toast } = useToast();

  const generateContent = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/generate`);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "블로그 생성 시작",
        description: "SEO 최적화된 블로그 포스트를 생성하고 있습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "블로그 생성 실패",
        description: error.message || "블로그 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateContent.mutate(project.id);
  };

  return (
    <Button 
      onClick={handleGenerate}
      disabled={generateContent.isPending}
      size="lg"
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
    >
      {generateContent.isPending ? (
        <>
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          블로그 생성 중...
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5 mr-2" />
          블로그 생성 시작
        </>
      )}
    </Button>
  );
}