
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, BookOpen, Code, Brain } from 'lucide-react';
import { useQuestionBanks } from '@/hooks/useQuestionBanks';
import jsPDF from 'jspdf';

const QuestionBankGenerator: React.FC = () => {
  const { questionBanks, loading } = useQuestionBanks();
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');

  const generateQuestionsPDF = (technology: string) => {
    const bank = questionBanks.find(qb => qb.technology === technology);
    if (!bank) return;

    const pdf = new jsPDF();
    
    // Title Page
    pdf.setFontSize(24);
    pdf.setTextColor(59, 130, 246);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${technology} Interview Questions`, 105, 30, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(75, 85, 99);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Complete Question Bank with Answers`, 105, 50, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Category: ${bank.category}`, 105, 70, { align: 'center' });
    pdf.text(`Difficulty: ${bank.difficulty_level}`, 105, 85, { align: 'center' });
    pdf.text(`Total Questions: ${bank.questions.length}`, 105, 100, { align: 'center' });
    
    // Add generation date
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 270, { align: 'center' });
    
    // Start questions on new page
    pdf.addPage();
    
    let yPosition = 30;
    const pageHeight = 280;
    const marginBottom = 20;
    
    bank.questions.forEach((qa, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - marginBottom) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Question number and text
      pdf.setFontSize(14);
      pdf.setTextColor(59, 130, 246);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Q${index + 1}. ${qa.question}`, 20, yPosition);
      
      yPosition += 15;
      
      // Answer
      pdf.setFontSize(11);
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      
      // Split long answers into multiple lines
      const splitAnswer = pdf.splitTextToSize(qa.answer, 170);
      pdf.text(splitAnswer, 20, yPosition);
      
      yPosition += splitAnswer.length * 5 + 15; // Adjust spacing based on answer length
    });
    
    // Save the PDF
    pdf.save(`${technology}_Interview_Questions.pdf`);
  };

  const technologies = [...new Set(questionBanks.map(qb => qb.technology))];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Interview Question Banks
        </CardTitle>
        <CardDescription>
          Download comprehensive question banks with answers for different technologies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Technology Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questionBanks.map((bank) => (
            <Card key={bank.id} className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {bank.technology === 'React' && <Code className="h-4 w-4 text-blue-600" />}
                      {bank.technology === 'Node.js' && <Brain className="h-4 w-4 text-green-600" />}
                      {bank.technology === 'Python' && <BookOpen className="h-4 w-4 text-yellow-600" />}
                      {!['React', 'Node.js', 'Python'].includes(bank.technology) && (
                        <FileText className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <Badge variant="outline">{bank.difficulty_level}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">{bank.technology}</h3>
                <p className="text-sm text-muted-foreground mb-3">{bank.category}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {bank.questions.length} Questions
                  </span>
                  <Badge className="bg-blue-100 text-blue-800">
                    With Answers
                  </Badge>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => generateQuestionsPDF(bank.technology)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {questionBanks.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No question banks available</h3>
            <p className="text-muted-foreground">
              Question banks will be available once they are created by administrators.
            </p>
          </div>
        )}
        
        {/* Sample Questions Preview */}
        {questionBanks.length > 0 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Sample Questions Preview</CardTitle>
              <CardDescription>
                Get a preview of the types of questions included in our question banks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionBanks.slice(0, 2).map((bank) => (
                  <div key={bank.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{bank.technology}</Badge>
                      <span className="text-sm text-muted-foreground">Sample Question</span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">
                        Q: {bank.questions[0]?.question}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        A: {bank.questions[0]?.answer.substring(0, 150)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionBankGenerator;
