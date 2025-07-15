import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, ArrowRight } from "lucide-react";

interface BusinessInfoFormProps {
  project: any;
  onRefresh: () => void;
}

export function BusinessInfoForm({ project, onRefresh }: BusinessInfoFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [expertise, setExpertise] = useState("");
  const [differentiators, setDifferentiators] = useState("");
  const { toast } = useToast();

  const saveBusinessInfo = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/business`, data);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "업체 정보 저장 완료",
        description: "블로그 생성을 시작하세요.",
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

  const generateContent = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/projects/${id}/generate`, {});
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "블로그 생성 완료",
        description: "생성된 블로그를 확인하세요.",
      });
    },
    onError: (error) => {
      toast({
        title: "생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!businessName.trim() || !businessType.trim() || !expertise.trim() || !differentiators.trim()) {
      toast({
        title: "정보 입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    saveBusinessInfo.mutate({
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      expertise: expertise.trim(),
      differentiators: differentiators.trim(),
    });
  };

  const handleGenerate = () => {
    generateContent.mutate(project.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Building2 className="h-5 w-5 text-primary mr-2" />
          업체 정보 입력
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">업체명</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="예: 김자영 자동차 정비소"
            />
          </div>
          <div>
            <Label htmlFor="businessType">업종</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue placeholder="업종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="자동차 정비">자동차 정비</SelectItem>
                <SelectItem value="음식점">음식점</SelectItem>
                <SelectItem value="미용실">미용실</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="expertise">전문성 및 경력</Label>
            <Textarea
              id="expertise"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="예: 20년 경력의 자동차 정비 전문가, 현대/기아 공식 인증 정비사"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="differentiators">차별점 및 강점</Label>
            <Textarea
              id="differentiators"
              value={differentiators}
              onChange={(e) => setDifferentiators(e.target.value)}
              placeholder="예: 정품 오일만 사용, 무료 점검 서비스, 24시간 긴급출동 서비스"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          {project.status === 'business_info' && (
            <Button 
              onClick={handleSave}
              disabled={saveBusinessInfo.isPending}
            >
              {saveBusinessInfo.isPending ? "저장 중..." : "정보 저장"}
            </Button>
          )}
          
          {project.status === 'content_generation' && (
            <Button 
              onClick={handleGenerate}
              disabled={generateContent.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {generateContent.isPending ? (
                <>Claude로 생성 중...</>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  블로그 생성
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
