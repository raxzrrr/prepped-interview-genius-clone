import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AddQuestionFormProps {
  onAddQuestion: (questionData: {
    question_text: string;
    difficulty_level: 'easy' | 'intermediate' | 'hard';
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_answer: number;
    explanation?: string;
    order_index: number;
  }) => Promise<void>;
  onCancel: () => void;
  nextOrderIndex: number;
}

const AddQuestionForm: React.FC<AddQuestionFormProps> = ({ 
  onAddQuestion, 
  onCancel, 
  nextOrderIndex 
}) => {
  const [formData, setFormData] = useState({
    question_text: '',
    difficulty_level: 'easy' as 'easy' | 'intermediate' | 'hard',
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
    correct_answer: '1',
    explanation: '',
    order_index: nextOrderIndex
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question_text.trim()) {
      alert('Question text is required');
      return;
    }
    
    if (!formData.option_1.trim() || !formData.option_2.trim() || 
        !formData.option_3.trim() || !formData.option_4.trim()) {
      alert('All options are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onAddQuestion({
        question_text: formData.question_text.trim(),
        difficulty_level: formData.difficulty_level,
        option_1: formData.option_1.trim(),
        option_2: formData.option_2.trim(),
        option_3: formData.option_3.trim(),
        option_4: formData.option_4.trim(),
        correct_answer: parseInt(formData.correct_answer),
        explanation: formData.explanation.trim() || undefined,
        order_index: formData.order_index
      });
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Add New Question</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Question Text</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter the question..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty_level">Difficulty Level</Label>
            <Select 
              value={formData.difficulty_level} 
              onValueChange={(value: 'easy' | 'intermediate' | 'hard') => 
                setFormData({ ...formData, difficulty_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="option_1">Option 1</Label>
              <Input
                id="option_1"
                value={formData.option_1}
                onChange={(e) => setFormData({ ...formData, option_1: e.target.value })}
                placeholder="First option..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option_2">Option 2</Label>
              <Input
                id="option_2"
                value={formData.option_2}
                onChange={(e) => setFormData({ ...formData, option_2: e.target.value })}
                placeholder="Second option..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option_3">Option 3</Label>
              <Input
                id="option_3"
                value={formData.option_3}
                onChange={(e) => setFormData({ ...formData, option_3: e.target.value })}
                placeholder="Third option..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option_4">Option 4</Label>
              <Input
                id="option_4"
                value={formData.option_4}
                onChange={(e) => setFormData({ ...formData, option_4: e.target.value })}
                placeholder="Fourth option..."
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Correct Answer</Label>
            <RadioGroup 
              value={formData.correct_answer} 
              onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="correct_1" />
                <Label htmlFor="correct_1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="correct_2" />
                <Label htmlFor="correct_2">Option 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="correct_3" />
                <Label htmlFor="correct_3">Option 3</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="correct_4" />
                <Label htmlFor="correct_4">Option 4</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this answer is correct..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Question'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddQuestionForm;