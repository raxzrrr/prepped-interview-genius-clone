
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface Certificate {
  id: string;
  title: string;
  completedDate: string;
  score: number;
  certificateUrl?: string;
}

interface CertificateViewerProps {
  certificate: Certificate;
  userName: string;
  onClose: () => void;
  onDownload: () => void;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ 
  certificate, 
  userName, 
  onClose, 
  onDownload 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Certificate Preview</CardTitle>
          <div className="flex gap-2">
            <Button onClick={onDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg border-2 border-blue-200">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800">Certificate of Completion</h1>
                <div className="w-32 h-1 bg-blue-600 mx-auto rounded"></div>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg text-gray-600">This certifies that</p>
                <p className="text-4xl font-bold text-blue-800">{userName}</p>
                <p className="text-lg text-gray-600">has successfully completed</p>
                <p className="text-2xl font-semibold text-gray-800">{certificate.title}</p>
              </div>
              
              <div className="flex justify-center items-center space-x-8 pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Completion Date</p>
                  <p className="font-semibold text-gray-800">{certificate.completedDate}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Final Score</p>
                  <p className="font-semibold text-gray-800">{certificate.score}%</p>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="inline-block">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">✓</div>
                      <div className="text-xs">CERTIFIED</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 pt-4">
                Certificate ID: {certificate.id}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateViewer;
