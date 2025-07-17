
import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import QuestionBankGenerator from '@/components/QuestionBanks/QuestionBankGenerator';
import { FileText } from 'lucide-react';

const QuestionBanksPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Question Banks</h1>
            <p className="text-muted-foreground mt-1">
              Download comprehensive question banks with detailed answers
            </p>
          </div>
        </div>
        
        <QuestionBankGenerator />
      </div>
    </DashboardLayout>
  );
};

export default QuestionBanksPage;
