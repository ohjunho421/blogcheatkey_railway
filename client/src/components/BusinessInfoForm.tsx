import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, ArrowRight, Check, ChevronsUpDown, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessInfoFormProps {
  project: any;
  onRefresh: () => void;
}

const businessTypes = [
  "자동차 정비",
  "음식점",
  "카페",
  "미용실",
  "네일샵",
  "의류매장",
  "편의점",
  "마트",
  "PC방",
  "노래방",
  "학원",
  "부동산",
  "세탁소",
  "꽃가게",
  "약국",
  "안경점",
  "펜션",
  "호텔",
  "치킨집",
  "피자집",
  "베이커리",
  "한식당",
  "중식당",
  "일식당",
  "양식당",
  "분식집",
  "족발보쌈",
  "찜닭",
  "떡볶이",
  "회전초밥",
  "삼겹살집",
  "곱창집",
  "치과",
  "한의원",
  "피부과",
  "정형외과",
  "내과",
  "이비인후과",
  "안과",
  "산부인과",
  "소아과",
  "정신과",
  "헬스장",
  "요가원",
  "필라테스",
  "태권도장",
  "수영장",
  "골프연습장",
  "볼링장",
  "당구장",
  "서점",
  "문구점",
  "화장품가게",
  "휴대폰가게",
  "컴퓨터수리점",
  "세차장",
  "주유소",
  "타이어샵",
  "카센터"
];

export function BusinessInfoForm({ project, onRefresh }: BusinessInfoFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [open, setOpen] = useState(false);
  const [expertise, setExpertise] = useState("");
  const [differentiators, setDifferentiators] = useState("");
  const { toast } = useToast();

  // Get saved business info from user profile
  const { data: savedBusinessInfo, isLoading: loadingBusinessInfo } = useQuery({
    queryKey: ["/api/user/business-info"],
    retry: false,
  });

  // Load saved business info when component mounts
  useEffect(() => {
    if (savedBusinessInfo) {
      setBusinessName(savedBusinessInfo.businessName || "");
      setBusinessType(savedBusinessInfo.businessType || "");
      setExpertise(savedBusinessInfo.expertise || "");
      setDifferentiators(savedBusinessInfo.differentiators || "");
    }
  }, [savedBusinessInfo]);

  // Save to user profile (reusable across projects)
  const saveToProfile = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/user/business-info", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "업체 정보 저장 완료",
        description: "업체 정보가 프로필에 저장되었습니다.",
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

  // Save to current project
  const saveBusinessInfo = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/business`, data);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      toast({
        title: "프로젝트 업체 정보 저장 완료",
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

  const handleSaveToProfile = () => {
    const finalBusinessType = businessType || customBusinessType;
    if (!businessName.trim() || !finalBusinessType.trim() || !expertise.trim() || !differentiators.trim()) {
      toast({
        title: "정보 입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    saveToProfile.mutate({
      businessName: businessName.trim(),
      businessType: finalBusinessType.trim(),
      expertise: expertise.trim(),
      differentiators: differentiators.trim(),
    });
  };

  const handleSave = () => {
    const finalBusinessType = businessType || customBusinessType;
    if (!businessName.trim() || !finalBusinessType.trim() || !expertise.trim() || !differentiators.trim()) {
      toast({
        title: "정보 입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // Save to both profile and project
    saveToProfile.mutate({
      businessName: businessName.trim(),
      businessType: finalBusinessType.trim(),
      expertise: expertise.trim(),
      differentiators: differentiators.trim(),
    });

    saveBusinessInfo.mutate({
      businessName: businessName.trim(),
      businessType: finalBusinessType.trim(),
      expertise: expertise.trim(),
      differentiators: differentiators.trim(),
    });
  };

  const handleGenerate = () => {
    generateContent.mutate(project.id);
  };

  const isGenerating = generateContent.isPending;

  return (
    <Card className={isGenerating ? "border-accent" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-primary mr-2" />
            업체 정보 입력
          </div>
          {isGenerating && (
            <div className="flex items-center text-accent text-sm">
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              블로그 생성 중...
            </div>
          )}
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {businessType || customBusinessType || "업종을 선택하거나 직접 입력하세요"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="업종 검색 또는 직접 입력..." 
                    value={customBusinessType}
                    onValueChange={setCustomBusinessType}
                  />
                  <CommandList>
                    <CommandEmpty>직접 입력한 업종이 사용됩니다.</CommandEmpty>
                    <CommandGroup>
                      {businessTypes.map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={(currentValue) => {
                            setBusinessType(currentValue === businessType ? "" : currentValue);
                            setCustomBusinessType("");
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              businessType === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
        
        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={handleSaveToProfile}
              disabled={saveToProfile.isPending || loadingBusinessInfo}
            >
              {saveToProfile.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  프로필에 저장
                </>
              )}
            </Button>
          </div>

          <div className="flex space-x-2">
            {project.status === 'business_info' && (
              <Button 
                onClick={handleSave}
                disabled={saveBusinessInfo.isPending || loadingBusinessInfo}
              >
                {saveBusinessInfo.isPending ? "저장 중..." : "정보 저장"}
              </Button>
            )}
            
            {(project.status === 'content_generation' || project.status === 'completed') && (
              <Button 
                onClick={handleGenerate}
                disabled={generateContent.isPending}
                className="bg-accent hover:bg-accent/90"
              >
                {generateContent.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Claude로 생성 중...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {project.status === 'completed' ? '블로그 재생성' : '블로그 생성'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
