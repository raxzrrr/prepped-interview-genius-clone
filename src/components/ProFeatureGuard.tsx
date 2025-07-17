
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, ArrowRight, Gift } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useInterviewUsage } from '@/hooks/useInterviewUsage';

interface ProFeatureGuardProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  allowFreeInterview?: boolean;
}

const ProFeatureGuard: React.FC<ProFeatureGuardProps> = ({ 
  children, 
  featureName, 
  description = "This feature is available for Pro subscribers only.",
  allowFreeInterview = false
}) => {
  const { hasProPlan, loading: subscriptionLoading } = useSubscription();
  const { canUseFreeInterview, loading: usageLoading } = useInterviewUsage();
  const navigate = useNavigate();

  const loading = subscriptionLoading || usageLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  // If user has Pro plan, show content
  if (hasProPlan()) {
    return <>{children}</>;
  }

  // If free interview is allowed and user can use it, show content
  if (allowFreeInterview && canUseFreeInterview()) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <div className="relative">
            {allowFreeInterview && !canUseFreeInterview() ? (
              <Gift className="h-12 w-12 text-gray-400" />
            ) : (
              <Lock className="h-12 w-12 text-gray-400" />
            )}
            <Crown className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <span>{featureName}</span>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            PRO
          </Badge>
        </CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {allowFreeInterview && !canUseFreeInterview() 
            ? "You've used your free interview. Upgrade to Pro for unlimited access!"
            : description
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Unlock with Pro Plan</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Resume-based interviews</li>
              <li>• Full Learning Hub access</li>
              <li>• Professional certificates</li>
              <li>• Unlimited practice sessions</li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate('/#pricing')} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Upgrade to Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProFeatureGuard;
