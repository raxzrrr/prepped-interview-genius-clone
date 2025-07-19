import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Trash2, Save, X, CheckCircle } from 'lucide-react';
import { CourseQuestion } from '@/services/questionService';

interface QuestionListItemProps {
  question: CourseQuestion;
  isEditing: boolean;
  editingQuestion?: CourseQuestion | null;
  onEdit: (question: CourseQuestion) => void;
  onSave: (question: CourseQuestion) => void;
  onCancel: () => void;
  onDelete: (questionId: string, courseId: string) => void;
  onEditingChange: (question: CourseQuestion | null) => void;
}

const QuestionListItem: React.FC<QuestionListItemProps> = ({
  question,
  isEditing,
  editingQuestion,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditingChange
}) => {
  const [editData, setEditData] = useState(question);

  const handleSave = () => {
    onSave(editData);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const options = [question.option_1, question.option_2, question.option_3, question.option_4];

  if (isEditing) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Text</label>
              <Textarea
                value={editData.question_text}
                onChange={(e) => setEditData({ ...editData, question_text: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Select
                value={editData.difficulty_level}
                onValueChange={(value: 'easy' | 'intermediate' | 'hard') =>
                  setEditData({ ...editData, difficulty_level: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Option 1</label>
                <Input
                  value={editData.option_1}
                  onChange={(e) => setEditData({ ...editData, option_1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Option 2</label>
                <Input
                  value={editData.option_2}
                  onChange={(e) => setEditData({ ...editData, option_2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Option 3</label>
                <Input
                  value={editData.option_3}
                  onChange={(e) => setEditData({ ...editData, option_3: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Option 4</label>
                <Input
                  value={editData.option_4}
                  onChange={(e) => setEditData({ ...editData, option_4: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Correct Answer</label>
              <RadioGroup
                value={editData.correct_answer.toString()}
                onValueChange={(value) => setEditData({ ...editData, correct_answer: parseInt(value) })}
                className="flex flex-row space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="edit_correct_1" />
                  <label htmlFor="edit_correct_1" className="text-sm">Option 1</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="edit_correct_2" />
                  <label htmlFor="edit_correct_2" className="text-sm">Option 2</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="edit_correct_3" />
                  <label htmlFor="edit_correct_3" className="text-sm">Option 3</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="edit_correct_4" />
                  <label htmlFor="edit_correct_4" className="text-sm">Option 4</label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation (Optional)</label>
              <Textarea
                value={editData.explanation || ''}
                onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-white ${getDifficultyColor(question.difficulty_level)}`}>
                {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Order: {question.order_index + 1}
              </span>
            </div>
            
            <h4 className="font-medium mb-3">{question.question_text}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className={`flex items-center p-2 rounded text-sm ${
                    question.correct_answer === index + 1 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {question.correct_answer === index + 1 && (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  )}
                  <span className="font-medium mr-2">{index + 1}.</span>
                  {option}
                </div>
              ))}
            </div>

            {question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={() => onEdit(question)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(question.id, question.course_id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionListItem;