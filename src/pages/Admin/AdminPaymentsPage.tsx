import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { RefreshCw, CreditCard, IndianRupee, TrendingUp } from 'lucide-react';

type Payment = Database['public']['Tables']['payments']['Row'];

interface DisplayPayment extends Payment {
  user_name?: string | null;
  user_email?: string | null;
}

const AdminPaymentsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  if (!user && !isTempAdmin) return <Navigate to="/login" />;
  if (!isAdmin() && !isTempAdmin) return <Navigate to="/dashboard" />;

  const [payments, setPayments] = useState<DisplayPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const ids = Array.from(new Set((data || []).map(p => p.user_id)));
      let profilesMap = new Map<string, { full_name: string; email: string | null }>();
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids as string[]);
        (profiles || []).forEach((pr: any) => profilesMap.set(pr.id, { full_name: pr.full_name, email: pr.email }));
      }

      const merged = (data || []).map(p => ({
        ...p,
        user_name: profilesMap.get(p.user_id)?.full_name ?? null,
        user_email: profilesMap.get(p.user_id)?.email ?? null,
      }));
      setPayments(merged);
    } catch (e) {
      console.error('Failed to fetch payments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('payments-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchPayments())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const completed = payments.filter(p => p.status === 'completed');
    const failed = payments.filter(p => p.status !== 'completed');
    const revenue = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { completed: completed.length, failed: failed.length, total: payments.length, revenue };
  }, [payments]);

  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="mt-2 text-gray-600">Track payments and revenue</p>
          </div>
          <Button variant="outline" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Total Revenue</CardTitle>
              <CardDescription>Sum of completed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{inr.format(stats.revenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Completed</CardTitle>
              <CardDescription>Successful payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total</CardTitle>
              <CardDescription>All recorded payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest 100 payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.user_name || '—'}</span>
                          <span className="text-sm text-muted-foreground">{p.user_email || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{p.plan_type}</TableCell>
                      <TableCell>{inr.format(p.amount || 0)} {p.currency}</TableCell>
                      <TableCell>
                        {p.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
                        ) : (
                          <Badge variant="outline">{p.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.razorpay_payment_id}</TableCell>
                    </TableRow>
                  ))}
                  {!payments.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No payments found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentsPage;
