
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  BarChart3,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockPerformanceData = [
  { name: 'Week 1', score: 65 },
  { name: 'Week 2', score: 72 },
  { name: 'Week 3', score: 78 },
  { name: 'Week 4', score: 85 },
];

const mockSkillsData = [
  { name: 'Technical', value: 85, color: '#8B5CF6' },
  { name: 'Communication', value: 78, color: '#06B6D4' },
  { name: 'Problem Solving', value: 92, color: '#10B981' },
  { name: 'Leadership', value: 70, color: '#F59E0B' },
];

interface DashboardAnalyticsProps {
  interviewCount?: number;
  currentStreak?: number;
  averageScore?: number;
  certificateCount?: number;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  interviewCount = 12,
  currentStreak = 5,
  averageScore = 82,
  certificateCount = 3
}) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="floating-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Sessions</CardTitle>
            <div className="p-2 glass-morphism rounded-lg group-hover:scale-110 transition-transform">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {interviewCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {interviewCount > 0 ? 'Great progress!' : 'Start your first interview'}
            </p>
          </CardContent>
        </Card>

        <Card className="floating-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <div className="p-2 glass-morphism rounded-lg group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {currentStreak} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStreak > 0 ? 'Keep it up! 🔥' : 'Start building your streak'}
            </p>
          </CardContent>
        </Card>

        <Card className="floating-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <div className="p-2 glass-morphism rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              {averageScore}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {averageScore > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  {averageScore >= 80 ? 'Excellent!' : averageScore >= 60 ? 'Good progress' : 'Keep improving'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="floating-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
            <div className="p-2 glass-morphism rounded-lg group-hover:scale-110 transition-transform">
              <Award className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              {certificateCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {certificateCount > 0 ? 'Well earned!' : 'Complete courses to earn certificates'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 glass-morphism rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Performance Trend
            </CardTitle>
            <CardDescription>Your interview scores over the last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 glass-morphism rounded-lg">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              Skills Breakdown
            </CardTitle>
            <CardDescription>Your performance across different skill areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockSkillsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockSkillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {mockSkillsData.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 p-3 glass-morphism rounded-xl">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: skill.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">{skill.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
