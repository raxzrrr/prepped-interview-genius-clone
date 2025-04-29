
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share, Printer, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface InterviewReportProps {
  questions: string[];
  answers: string[];
  onStartNewInterview: () => void;
}

const InterviewReport: React.FC<InterviewReportProps> = ({ 
  questions, 
  answers, 
  onStartNewInterview 
}) => {
  const { toast } = useToast();
  
  // Mock data
  const facialAnalysis = {
    overall: "Positive",
    confidence: 72,
    engagement: 84,
    nervous: 35,
    facial_expressions: {
      happy: 28,
      neutral: 45,
      anxious: 15,
      confused: 7,
      focused: 5
    }
  };
  
  const idealAnswers = [
    "When discussing React experience, focus on specific projects, technical challenges you've overcome, and measurable outcomes. Mention your familiarity with React hooks, context API, and state management solutions.",
    "For problem-solving questions, use the STAR method (Situation, Task, Action, Result). Clearly explain the challenge, your role, the specific actions you took, and quantify the positive outcome.",
    "When addressing time management, emphasize your prioritization methods, ability to communicate effectively about deadlines, and examples of successfully managing competing priorities.",
    "Questions about your interest in the position should reflect your research on the company. Connect your skills and career goals specifically to the role and company mission.",
    "For process questions, demonstrate a methodical approach that considers business requirements, technical constraints, and collaboration with team members. Mention your testing strategy.",
    "Professional development questions should highlight your proactive learning habits, specific resources you use, and how you've applied new knowledge in practical situations.",
    "When discussing agile experience, mention specific methodologies (Scrum, Kanban), your role in ceremonies, and how you've contributed to process improvements.",
    "Learning new technologies quickly requires a structured approach. Describe your learning strategy, how you find resources, and a specific example where you delivered results with a newly learned technology.",
    "Code quality questions should address your testing philosophy, experience with CI/CD, code reviews, and examples of maintaining high standards even under pressure.",
    "Career goal questions require self-awareness and authenticity. Align your answer with realistic progression that shows ambition but also commitment to the role you're interviewing for.",
    "Achievement questions are perfect for showcasing your impact. Choose an example that demonstrates technical excellence, leadership, problem-solving, and quantifiable results.",
    "For feedback questions, show that you separate yourself from the criticism, actively listen, confirm understanding, and take concrete actions to improve based on feedback.",
    "Cross-functional communication should highlight your ability to translate technical concepts for different audiences, active listening skills, and examples of successful collaboration.",
    "Motivation questions reveal your values. Connect your answer to intrinsic motivators like problem-solving, creating impact, and continuous learning rather than just extrinsic rewards.",
    "Decision-making with limited information demonstrates your critical thinking. Describe your approach to gathering available data, consulting experts, evaluating risks, and making timely decisions."
  ];

  const downloadReport = () => {
    toast({
      title: "Report Downloaded",
      description: "Your interview report has been downloaded.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interview Performance Report</CardTitle>
        <CardDescription>
          Comprehensive analysis of your interview performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 text-center border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="mb-1 text-xl font-semibold">15</h3>
            <p className="text-sm text-gray-600">Questions Answered</p>
          </div>
          
          <div className="p-4 text-center border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-1 text-xl font-semibold">{facialAnalysis.confidence}%</h3>
            <p className="text-sm text-gray-600">Confidence Score</p>
          </div>
          
          <div className="p-4 text-center border rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-1 text-xl font-semibold">{facialAnalysis.engagement}%</h3>
            <p className="text-sm text-gray-600">Engagement Level</p>
          </div>
        </div>
        
        <Tabs defaultValue="questions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
            <TabsTrigger value="facial">Facial Analysis</TabsTrigger>
            <TabsTrigger value="suggestions">Improvement Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions" className="py-4">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">Question {index + 1}:</h3>
                  <p className="mb-4 text-gray-800">{question}</p>
                  
                  <div className="mb-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Your Answer:</h4>
                    <p className="p-3 text-sm text-gray-600 bg-gray-50 rounded-md">
                      {answers[index] || "No answer recorded"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Suggested Answer:</h4>
                    <p className="p-3 text-sm text-gray-600 bg-green-50 rounded-md">
                      {idealAnswers[index] || "No suggested answer available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="facial" className="py-4">
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Facial Expression Analysis</h3>
                
                <div className="mb-6">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Overall Impression</h4>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-600">
                      Your facial expressions conveyed an overall <span className="font-medium text-green-600">{facialAnalysis.overall}</span> impression during the interview, with good engagement and moderate confidence.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Expression Breakdown</h4>
                    <ul className="space-y-2">
                      {Object.entries(facialAnalysis.facial_expressions).map(([expression, percentage], index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <span className="capitalize">{expression}</span>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Insights</h4>
                    <div className="p-3 bg-gray-50 rounded-md space-y-2">
                      <p className="text-sm text-gray-600">
                        You appeared confident during most of the interview, with occasional signs of anxiety when discussing technical skills.
                      </p>
                      <p className="text-sm text-gray-600">
                        Your focused expressions demonstrate good listening skills and thoughtful responses.
                      </p>
                      <p className="text-sm text-gray-600">
                        Consider maintaining more consistent eye contact to convey stronger confidence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Body Language Observations</h3>
                <div className="p-3 bg-gray-50 rounded-md space-y-2">
                  <p className="text-sm text-gray-600">
                    Your posture was generally upright and engaged, indicating attentiveness and respect.
                  </p>
                  <p className="text-sm text-gray-600">
                    Hand gestures were natural and helped emphasize key points during technical explanations.
                  </p>
                  <p className="text-sm text-gray-600">
                    Minor fidgeting was detected during challenging questions, which may indicate nervousness.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions" className="py-4">
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Strengths</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Strong technical knowledge demonstrated through specific examples</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Well-structured answers with clear problem-solution narratives</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Effective communication of complex concepts in accessible language</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Good engagement and positive facial expressions</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-700">
                      Answers to behavioral questions could include more quantifiable results
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-700">
                      Consider reducing filler words like "um" and "you know" for more polished delivery
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-700">
                      Some technical answers could be more concise while maintaining their effectiveness
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-700">
                      Practice maintaining more consistent eye contact during responses
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Recommended Learning Resources</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-brand-purple">Behavioral Interview Techniques</h4>
                    <p className="text-sm text-gray-600">
                      Explore the STAR method in depth with our video course in the Learning Hub.
                    </p>
                    <a href="/learning/behavioral-techniques" className="text-sm font-medium text-brand-purple hover:underline">View Course →</a>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-brand-purple">Confident Communication</h4>
                    <p className="text-sm text-gray-600">
                      Master techniques for eliminating filler words and projecting confidence.
                    </p>
                    <a href="/learning/communication" className="text-sm font-medium text-brand-purple hover:underline">View Course →</a>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-brand-purple">Technical Interview Preparation</h4>
                    <p className="text-sm text-gray-600">
                      Enhance your ability to explain complex technical concepts clearly and concisely.
                    </p>
                    <a href="/learning/technical-interviews" className="text-sm font-medium text-brand-purple hover:underline">View Course →</a>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex flex-wrap justify-between w-full gap-4">
          <Button
            variant="outline"
            onClick={downloadReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <Button
          className="w-full"
          onClick={onStartNewInterview}
        >
          Start New Interview
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InterviewReport;
