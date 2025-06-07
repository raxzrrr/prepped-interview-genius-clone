
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Award } from 'lucide-react';

interface Certificate {
  id: string;
  title: string;
  completedDate: string;
  score: number;
  certificateUrl?: string;
}

interface CertificateCardProps {
  certificate: Certificate;
  onDownload: (certificate: Certificate) => void;
  onView: (certificate: Certificate) => void;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ 
  certificate, 
  onDownload, 
  onView 
}) => {
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">{certificate.title}</CardTitle>
          </div>
          <Badge variant={getScoreBadgeVariant(certificate.score)}>
            {certificate.score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Completed on</p>
            <p className="font-medium">{certificate.completedDate}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onView(certificate)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button 
              size="sm"
              onClick={() => onDownload(certificate)}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
