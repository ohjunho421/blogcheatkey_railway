import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Plus, Edit3, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessInfo {
  id: number;
  businessName: string;
  businessType: string;
  expertise: string;
  differentiators: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface BusinessProfileManagerProps {
  selectedBusinessId?: number;
  onBusinessSelect: (business: BusinessInfo | null) => void;
}

const businessTypes = [
  "자동차 정비", "음식점", "카페", "미용실", "네일샵", "의류매장", "편의점", "마트", "PC방", "노래방",
  "학원", "부동산", "세탁소", "꽃가게", "약국", "안경점", "펜션", "호텔", "치킨집", "피자집",
  "베이커리", "한식당", "중식당", "일식당", "양식당", "분식집", "족발보쌈", "찜닭", "떡볶이",
  "회전초밥", "삼겹살집", "곱창집", "치과", "한의원", "피부과", "정형외과", "내과", "이비인후과",
  "안과", "산부인과", "소아과", "정신과", "헬스장", "요가원", "필라테스", "태권도장", "수영장",
  "골프연습장", "볼링장", "당구장", "서점", "문구점", "화장품가게", "휴대폰가게", "컴퓨터수리점",
  "전자제품매장", "가구점", "리모델링", "인테리어", "청소업체", "보험대리점", "여행사", "은행",
  "증권사", "회계사무소", "법무사무소", "세무사무소", "광고대행사", "디자인스튜디오", "IT개발",
  "앱개발", "웹개발", "디지털마케팅", "온라인쇼핑몰", "기타"
];

export default function BusinessProfileManager({ selectedBusinessId, onBusinessSelect }: BusinessProfileManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    expertise: "",
    differentiators: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all business profiles
  const { data: businessProfiles, isLoading } = useQuery<BusinessInfo[]>({
    queryKey: ["/api/user/business-info"],
    retry: false,
  });

  // Create business profile
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/user/business-info", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/business-info"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "업체 프로필 생성 완료",
        description: "새로운 업체 프로필이 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update business profile
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiRequest("PUT", `/api/user/business-info/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/business-info"] });
      setIsEditDialogOpen(false);
      setEditingBusiness(null);
      resetForm();
      toast({
        title: "업체 프로필 수정 완료",
        description: "업체 프로필이 성공적으로 수정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete business profile
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/user/business-info/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/business-info"] });
      // If deleted business was selected, clear selection
      if (editingBusiness && selectedBusinessId === editingBusiness.id) {
        onBusinessSelect(null);
      }
      toast({
        title: "업체 프로필 삭제 완료",
        description: "업체 프로필이 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      businessName: "",
      businessType: "",
      expertise: "",
      differentiators: ""
    });
    setSelectedType("");
  };

  const handleCreate = () => {
    if (!formData.businessName || !formData.businessType || !formData.expertise || !formData.differentiators) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (business: BusinessInfo) => {
    setEditingBusiness(business);
    setFormData({
      businessName: business.businessName,
      businessType: business.businessType,
      expertise: business.expertise,
      differentiators: business.differentiators
    });
    setSelectedType(business.businessType);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingBusiness || !formData.businessName || !formData.businessType || !formData.expertise || !formData.differentiators) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id: editingBusiness.id, data: formData });
  };

  const handleDelete = (business: BusinessInfo) => {
    setEditingBusiness(business);
  };

  const selectedBusiness = businessProfiles?.find(b => b.id === selectedBusinessId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            업체 프로필 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          업체 프로필 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Selection */}
        <div className="space-y-2">
          <Label htmlFor="business-select">업체 선택</Label>
          <Select 
            value={selectedBusinessId?.toString() || ""} 
            onValueChange={(value) => {
              const business = businessProfiles?.find(b => b.id === parseInt(value)) || null;
              onBusinessSelect(business);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="업체를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {businessProfiles?.map((business) => (
                <SelectItem key={business.id} value={business.id.toString()}>
                  {business.businessName} ({business.businessType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Business Info Display */}
        {selectedBusiness && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">선택된 업체 정보</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">업체명:</span> {selectedBusiness.businessName}
              </div>
              <div>
                <span className="font-medium">업종:</span> {selectedBusiness.businessType}
              </div>
              <div className="col-span-2">
                <span className="font-medium">전문성:</span> {selectedBusiness.expertise}
              </div>
              <div className="col-span-2">
                <span className="font-medium">차별점:</span> {selectedBusiness.differentiators}
              </div>
            </div>
          </div>
        )}

        {/* Manage Profiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">프로필 관리</h4>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  새 프로필 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>새 업체 프로필 생성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">업체명</Label>
                    <Input
                      id="business-name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="업체명을 입력하세요"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-type">업종</Label>
                    <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={typeOpen}
                          className="w-full justify-between"
                        >
                          {selectedType || "업종을 선택하세요"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="업종을 검색하세요..." />
                          <CommandList>
                            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                            <CommandGroup>
                              {businessTypes.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
                                    setSelectedType(type);
                                    setFormData({ ...formData, businessType: type });
                                    setTypeOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedType === type ? "opacity-100" : "opacity-0"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="expertise">전문성 및 핵심 서비스</Label>
                    <Textarea
                      id="expertise"
                      value={formData.expertise}
                      onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                      placeholder="어떤 분야에 전문성이 있고, 어떤 서비스를 제공하는지 설명해주세요"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="differentiators">차별점 및 강점</Label>
                    <Textarea
                      id="differentiators"
                      value={formData.differentiators}
                      onChange={(e) => setFormData({ ...formData, differentiators: e.target.value })}
                      placeholder="다른 업체와 비교했을 때 특별한 점이나 강점을 설명해주세요"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "생성 중..." : "생성"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Business Profiles List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {businessProfiles?.map((business) => (
              <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{business.businessName}</div>
                  <div className="text-xs text-muted-foreground">{business.businessType}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(business)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(business)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>프로필 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{business.businessName}" 프로필을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(business.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {businessProfiles?.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                등록된 업체 프로필이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>업체 프로필 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-business-name">업체명</Label>
                <Input
                  id="edit-business-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="업체명을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-business-type">업종</Label>
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={typeOpen}
                      className="w-full justify-between"
                    >
                      {selectedType || "업종을 선택하세요"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="업종을 검색하세요..." />
                      <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {businessTypes.map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => {
                                setSelectedType(type);
                                setFormData({ ...formData, businessType: type });
                                setTypeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedType === type ? "opacity-100" : "opacity-0"
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
              
              <div className="space-y-2">
                <Label htmlFor="edit-expertise">전문성 및 핵심 서비스</Label>
                <Textarea
                  id="edit-expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="어떤 분야에 전문성이 있고, 어떤 서비스를 제공하는지 설명해주세요"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-differentiators">차별점 및 강점</Label>
                <Textarea
                  id="edit-differentiators"
                  value={formData.differentiators}
                  onChange={(e) => setFormData({ ...formData, differentiators: e.target.value })}
                  placeholder="다른 업체와 비교했을 때 특별한 점이나 강점을 설명해주세요"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}