import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

interface PaymentManagementTabProps {
  payments: any[];
}

export function PaymentManagementTab({ payments }: PaymentManagementTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [confirmNote, setConfirmNote] = useState("");

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: number; note: string }) => {
      const response = await apiRequest("POST", `/api/admin/payments/${paymentId}/confirm`, { note });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedPayment(null);
      setConfirmNote("");
      toast({
        title: "결제 확인 완료",
        description: "결제가 승인되고 사용자에게 권한이 부여되었습니다.",
      });
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: number; note: string }) => {
      const response = await apiRequest("POST", `/api/admin/payments/${paymentId}/reject`, { note });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      toast({
        title: "결제 거절 완료",
        description: "결제가 거절되었습니다.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          확인 대기
        </Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          승인됨
        </Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          거절됨
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    return planType === 'premium' 
      ? <Badge className="bg-purple-500">프리미엄</Badge>
      : <Badge className="bg-blue-500">베이직</Badge>;
  };

  const pendingPayments = payments.filter(p => p.paymentStatus === 'pending');
  const completedPayments = payments.filter(p => p.paymentStatus !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              확인 대기 중인 결제 ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{payment.userName}</h3>
                        {getPlanBadge(payment.planType)}
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">금액:</span>
                          <span className="ml-2 font-medium">
                            {payment.amount?.toLocaleString()}원
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">입금자명:</span>
                          <span className="ml-2 font-medium">{payment.depositorName || '미입력'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">신청일:</span>
                          <span className="ml-2">
                            {new Date(payment.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          확인 처리
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>결제 확인</DialogTitle>
                          <DialogDescription>
                            무통장 입금을 확인하고 사용자에게 권한을 부여합니다.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md space-y-1">
                            <p><strong>사용자:</strong> {payment.userName} ({payment.userEmail})</p>
                            <p><strong>플랜:</strong> {payment.planType === 'premium' ? '프리미엄' : '베이직'}</p>
                            <p><strong>금액:</strong> {payment.amount?.toLocaleString()}원</p>
                            <p><strong>입금자명:</strong> {payment.depositorName || '미입력'}</p>
                          </div>

                          <div>
                            <Label>확인 메모 (선택사항)</Label>
                            <Textarea
                              placeholder="예: 입금 확인 완료, 김철수 님 입금"
                              value={confirmNote}
                              onChange={(e) => setConfirmNote(e.target.value)}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              className="flex-1"
                              onClick={() => confirmPaymentMutation.mutate({ 
                                paymentId: payment.id, 
                                note: confirmNote 
                              })}
                              disabled={confirmPaymentMutation.isPending}
                            >
                              입금 확인 & 권한 부여
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => {
                                if (confirm('정말 이 결제를 거절하시겠습니까?')) {
                                  rejectPaymentMutation.mutate({ 
                                    paymentId: payment.id, 
                                    note: confirmNote || "관리자에 의해 거절됨" 
                                  });
                                }
                              }}
                            >
                              거절
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Payments */}
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedPayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{payment.userName}</h3>
                      {getPlanBadge(payment.planType)}
                      {getStatusBadge(payment.paymentStatus)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>{payment.userEmail}</div>
                      <div>{payment.amount?.toLocaleString()}원</div>
                      <div>신청: {new Date(payment.createdAt).toLocaleDateString('ko-KR')}</div>
                      {payment.confirmedAt && (
                        <div>승인: {new Date(payment.confirmedAt).toLocaleDateString('ko-KR')}</div>
                      )}
                    </div>

                    {payment.confirmationNote && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        메모: {payment.confirmationNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {completedPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                처리된 결제가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
