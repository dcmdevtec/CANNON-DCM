import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ApprovalEditor from '@/components/ApprovalEditor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export type ApprovalItem = {
  id: string;
  received_at: string;
  sender: string;
  subject: string;
  body_text: string;
  extracted_data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
};

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching approvals:', error);
      } else {
        setApprovals(data as ApprovalItem[]);
        if (data && data.length > 0) {
          setSelectedApproval(data[0] as ApprovalItem);
        }
      }
      setLoading(false);
    };

    fetchApprovals();
  }, []);

  const handleApprovalUpdate = (updatedApproval: ApprovalItem) => {
    const remainingApprovals = approvals.filter(item => item.id !== updatedApproval.id);
    setApprovals(remainingApprovals);
    
    if (remainingApprovals.length > 0) {
      const currentIndex = approvals.findIndex(item => item.id === updatedApproval.id);
      // Select the next item, or the previous one if the last one was selected
      const nextIndex = Math.min(currentIndex, remainingApprovals.length - 1);
      setSelectedApproval(remainingApprovals[nextIndex]);
    } else {
      setSelectedApproval(null);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-4">Cola de Aprobación de Correos</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Pendientes ({approvals.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                approvals.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedApproval?.id === item.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedApproval(item)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold truncate pr-2">{item.subject}</p>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.sender}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.received_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 min-h-0">
          {loading && !selectedApproval ? (
            <Card className="h-full flex flex-col">
              <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
              <CardContent className="flex-1 grid grid-cols-2 gap-6">
                <Skeleton className="h-full w-full" />
                <Skeleton className="h-full w-full" />
              </CardContent>
              <CardFooter><Skeleton className="h-10 w-1/3" /></CardFooter>
            </Card>
          ) : selectedApproval ? (
            <ApprovalEditor 
              key={selectedApproval.id} 
              approvalItem={selectedApproval}
              onApprovalUpdate={handleApprovalUpdate}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-lg font-semibold">¡Todo listo!</p>
                <p className="text-muted-foreground">No hay correos pendientes de aprobación.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueue;