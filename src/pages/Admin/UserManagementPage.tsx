
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, Loader2, MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Mail, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];

interface UserWithSubscription extends Profile {
  subscription?: UserSubscription;
}

const UserManagementPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  
  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchUsers();
    setupRealtimeSubscription();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their subscription data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
        return;
      }

      // Fetch subscriptions separately
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active');

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
      }

      // Combine profiles with subscriptions
      const usersWithSubscriptions: UserWithSubscription[] = (profilesData || []).map(profile => {
        const subscription = subscriptionsData?.find(sub => sub.user_id === profile.id);
        return {
          ...profile,
          subscription
        };
      });

      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as UserWithSubscription, ...prev]);
            toast({
              title: "New User",
              description: `${(payload.new as Profile).full_name} has joined`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? { ...user, ...payload.new as Profile } : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        (payload) => {
          console.log('Subscriptions realtime update:', payload);
          fetchUsers(); // Refresh to get updated subscription data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleUpdateUser = async (updatedUser: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          status: updatedUser.status,
          email: updatedUser.email,
          last_active: new Date().toISOString()
        })
        .eq('id', updatedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive"
        });
        return;
      }

      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User information has been successfully updated",
      });
    } catch (error) {
      console.error('Error in handleUpdateUser:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating status:', error);
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `User status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error in handleToggleStatus:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'student':
        return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" />Student</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription?: UserSubscription) => {
    if (!subscription) {
      return <Badge variant="outline">Free</Badge>;
    }
    
    const isActive = subscription.status === 'active' && new Date(subscription.current_period_end) > new Date();
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
        <Shield className="w-3 h-3 mr-1" />
        {subscription.plan_type} {isActive ? '(Active)' : '(Expired)'}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users, roles, and subscriptions with real-time updates
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="bg-green-50 text-green-700">
            {filteredUsers.length} users • Live updates
          </Badge>
        </div>

        {editingUser && (
          <Card>
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update user information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: 'student' | 'admin') => setEditingUser({...editingUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editingUser.status || 'active'} 
                    onValueChange={(value: string) => setEditingUser({...editingUser, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => handleUpdateUser(editingUser)}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white font-medium">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                    <TableCell>{getSubscriptionBadge(user.subscription)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        {user.last_active ? formatDateTime(user.last_active) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No users found matching your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
