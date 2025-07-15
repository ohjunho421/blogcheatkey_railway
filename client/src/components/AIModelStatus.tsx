import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface AIModelStatusProps {
  project?: any;
}

export function AIModelStatus({ project }: AIModelStatusProps) {
  const getModelStatus = (modelName: string) => {
    if (!project) return "대기 중";
    
    switch (modelName) {
      case "Gemini 2.5 Pro":
        return project.keywordAnalysis ? "완료" : 
               project.status === "keyword_analysis" ? "분석 중" : "대기 중";
      case "Perplexity Sonar Pro":
        return project.researchData ? "완료" :
               project.status === "data_collection" ? "수집 중" : "대기 중";
      case "Claude 4":
        return project.generatedContent ? "완료" :
               project.status === "content_generation" ? "작성 중" : "대기 중";
      default:
        return "대기 중";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "bg-accent";
      case "분석 중":
      case "수집 중":
      case "작성 중":
        return "bg-yellow-500";
      default:
        return "bg-muted";
    }
  };

  const models = [
    "Gemini 2.5 Pro",
    "Perplexity Sonar Pro",
    "Claude 4"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bot className="h-5 w-5 text-primary mr-2" />
          AI 모델 상태
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {models.map((model) => {
            const status = getModelStatus(model);
            return (
              <div key={model} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                  <span className="text-sm font-medium">{model}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
