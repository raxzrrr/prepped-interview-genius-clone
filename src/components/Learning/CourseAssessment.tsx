import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Award, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import { downloadCertificate } from '@/services/certificateService';
import { learningService } from '@/services/learningService';

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'hard';
  explanation: string;
}

interface CourseAssessmentProps {
  courseId: string;
  courseName: string;
  isUnlocked: boolean;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

const CourseAssessment: React.FC<CourseAssessmentProps> = ({
  courseId,
  courseName,
  isUnlocked,
  onComplete,
  onClose
}) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  
  const { toast } = useToast();
  const { user, getSupabaseUserId } = useAuth();
  const { generateInterviewQuestions } = useInterviewApi();

  useEffect(() => {
    if (isUnlocked) {
      generateAssessmentQuestions();
    }
  }, [isUnlocked, courseId]);

  const getQuestionsForCourse = (courseName: string): AssessmentQuestion[] => {
    const courseKey = courseName.toLowerCase();
    
    // React/Frontend Questions
    if (courseKey.includes('react') || courseKey.includes('frontend') || courseKey.includes('javascript')) {
      return [
        // Easy React Questions
        {
          id: 'react_easy_1',
          question: 'What is JSX in React?',
          options: [
            'A JavaScript extension syntax',
            'A new programming language',
            'A CSS framework',
            'A database query language'
          ],
          correctAnswer: 0,
          difficulty: 'easy',
          explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.'
        },
        {
          id: 'react_easy_2',
          question: 'Which hook is used to manage state in functional components?',
          options: [
            'useEffect',
            'useState',
            'useContext',
            'useReducer'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'useState is the primary hook for managing local state in functional components.'
        },
        {
          id: 'react_easy_3',
          question: 'What is the correct way to render a list in React?',
          options: [
            'Using a for loop',
            'Using map() function',
            'Using forEach() function',
            'Using while loop'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The map() function is the standard way to render lists in React as it returns a new array of JSX elements.'
        },
        {
          id: 'react_easy_4',
          question: 'What is a React component?',
          options: [
            'A CSS class',
            'A JavaScript function or class that returns JSX',
            'An HTML element',
            'A database table'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'A React component is a reusable piece of code that returns JSX to describe what should be rendered.'
        },
        {
          id: 'react_easy_5',
          question: 'Which method is called when a component is first mounted?',
          options: [
            'componentDidUpdate',
            'componentWillUnmount',
            'componentDidMount',
            'componentWillMount'
          ],
          correctAnswer: 2,
          difficulty: 'easy',
          explanation: 'componentDidMount is called after the component is mounted and inserted into the DOM.'
        },
        {
          id: 'react_easy_6',
          question: 'What are props in React?',
          options: [
            'Internal component state',
            'Data passed from parent to child components',
            'CSS properties',
            'Event handlers'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'Props are properties passed down from parent components to child components.'
        },
        {
          id: 'react_easy_7',
          question: 'Which of the following is the correct way to handle events in React?',
          options: [
            'onclick="handleClick()"',
            'onClick={handleClick}',
            'on-click={handleClick}',
            'handleClick()'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'React uses camelCase event handlers like onClick and passes functions as references.'
        },
        {
          id: 'react_easy_8',
          question: 'What is the virtual DOM?',
          options: [
            'The actual browser DOM',
            'A JavaScript representation of the real DOM',
            'A CSS framework',
            'A React component'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The virtual DOM is a JavaScript representation of the real DOM that React uses for efficient updates.'
        },
        {
          id: 'react_easy_9',
          question: 'How do you import React in a component file?',
          options: [
            'include React from "react"',
            'import React from "react"',
            'require React from "react"',
            'load React from "react"'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'React is imported using ES6 import syntax: import React from "react".'
        },
        {
          id: 'react_easy_10',
          question: 'What is the purpose of keys in React lists?',
          options: [
            'To style list items',
            'To help React identify which items have changed',
            'To sort the list',
            'To validate data'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'Keys help React identify which list items have changed, been added, or removed for efficient re-rendering.'
        },
        // Hard React Questions
        {
          id: 'react_hard_1',
          question: 'What is the difference between useCallback and useMemo?',
          options: [
            'useCallback memoizes functions, useMemo memoizes values',
            'They are the same',
            'useCallback is for components, useMemo is for hooks',
            'useMemo memoizes functions, useCallback memoizes values'
          ],
          correctAnswer: 0,
          difficulty: 'hard',
          explanation: 'useCallback memoizes function references, while useMemo memoizes computed values to optimize performance.'
        },
        {
          id: 'react_hard_2',
          question: 'When should you use useLayoutEffect instead of useEffect?',
          options: [
            'For API calls',
            'When you need synchronous execution before DOM mutations',
            'For event listeners',
            'For state updates'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'useLayoutEffect runs synchronously after all DOM mutations, useful for measuring DOM elements or preventing visual flickering.'
        },
        {
          id: 'react_hard_3',
          question: 'What is React.memo() and when should you use it?',
          options: [
            'A hook for memory management',
            'A higher-order component for memoization',
            'A method to clear component cache',
            'A state management tool'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'React.memo() is a higher-order component that memoizes the result and only re-renders if props change.'
        },
        {
          id: 'react_hard_4',
          question: 'How do you handle errors in React components?',
          options: [
            'Using try-catch blocks',
            'Using Error Boundaries',
            'Using console.error',
            'Using alert()'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'Error Boundaries are React components that catch JavaScript errors in their component tree and display fallback UI.'
        },
        {
          id: 'react_hard_5',
          question: 'What is the purpose of the dependency array in useEffect?',
          options: [
            'To list all variables used in the effect',
            'To control when the effect should re-run',
            'To prevent memory leaks',
            'To optimize performance only'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'The dependency array controls when useEffect re-runs by comparing current and previous values.'
        },
        {
          id: 'react_hard_6',
          question: 'What is React Suspense used for?',
          options: [
            'Error handling',
            'State management',
            'Handling asynchronous operations and code splitting',
            'Event handling'
          ],
          correctAnswer: 2,
          difficulty: 'hard',
          explanation: 'React Suspense handles asynchronous operations like data fetching and enables code splitting with lazy loading.'
        },
        {
          id: 'react_hard_7',
          question: 'How does React\'s reconciliation algorithm work?',
          options: [
            'It compares the entire DOM',
            'It uses a diffing algorithm to compare virtual DOM trees',
            'It rebuilds the entire page',
            'It only updates changed components'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'React uses a diffing algorithm to compare virtual DOM trees and determine the minimum changes needed.'
        },
        {
          id: 'react_hard_8',
          question: 'What is the correct pattern for updating state based on previous state?',
          options: [
            'setState(state + 1)',
            'setState(prevState => prevState + 1)',
            'setState(this.state + 1)',
            'setState(newState)'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'When updating state based on previous state, use the functional update pattern to ensure correct behavior with batching.'
        },
        {
          id: 'react_hard_9',
          question: 'What is the difference between controlled and uncontrolled components?',
          options: [
            'Controlled components manage their own state',
            'Controlled components have their state managed by React',
            'Uncontrolled components are faster',
            'There is no difference'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'Controlled components have their state managed by React through props, while uncontrolled components manage their own state internally.'
        },
        {
          id: 'react_hard_10',
          question: 'How do you optimize React app performance?',
          options: [
            'Use more components',
            'Avoid using keys',
            'Use React.memo, useMemo, useCallback, and code splitting',
            'Use inline functions everywhere'
          ],
          correctAnswer: 2,
          difficulty: 'hard',
          explanation: 'Performance optimization involves memoization techniques, avoiding unnecessary re-renders, and code splitting for better loading times.'
        }
      ];
    }
    
    // Python/Backend Questions
    if (courseKey.includes('python') || courseKey.includes('backend') || courseKey.includes('django')) {
      return [
        // Easy Python Questions
        {
          id: 'python_easy_1',
          question: 'What is Python?',
          options: [
            'A compiled programming language',
            'An interpreted, high-level programming language',
            'A database management system',
            'A web browser'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'Python is an interpreted, high-level, general-purpose programming language known for its simplicity and readability.'
        },
        {
          id: 'python_easy_2',
          question: 'How do you declare a variable in Python?',
          options: [
            'var x = 5',
            'int x = 5',
            'x = 5',
            'declare x = 5'
          ],
          correctAnswer: 2,
          difficulty: 'easy',
          explanation: 'Python uses dynamic typing, so you simply assign a value to a variable name without declaring its type.'
        },
        {
          id: 'python_easy_3',
          question: 'Which of the following is used to create a function in Python?',
          options: [
            'function',
            'def',
            'create',
            'func'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The "def" keyword is used to define functions in Python.'
        },
        {
          id: 'python_easy_4',
          question: 'What is the correct way to create a list in Python?',
          options: [
            'list = (1, 2, 3)',
            'list = [1, 2, 3]',
            'list = {1, 2, 3}',
            'list = 1, 2, 3'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'Lists in Python are created using square brackets [].'
        },
        {
          id: 'python_easy_5',
          question: 'How do you add an item to a list in Python?',
          options: [
            'list.add(item)',
            'list.append(item)',
            'list.insert(item)',
            'list.push(item)'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The append() method adds an item to the end of a list in Python.'
        },
        {
          id: 'python_easy_6',
          question: 'What is the correct syntax for a for loop in Python?',
          options: [
            'for i in range(10):',
            'for (i = 0; i < 10; i++):',
            'for i = 1 to 10:',
            'loop i in range(10):'
          ],
          correctAnswer: 0,
          difficulty: 'easy',
          explanation: 'Python for loops use the syntax "for variable in iterable:" followed by a colon.'
        },
        {
          id: 'python_easy_7',
          question: 'How do you create a dictionary in Python?',
          options: [
            'dict = [key: value]',
            'dict = {key: value}',
            'dict = (key: value)',
            'dict = key: value'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'Dictionaries in Python are created using curly braces {} with key-value pairs.'
        },
        {
          id: 'python_easy_8',
          question: 'What does the len() function do?',
          options: [
            'Returns the last element',
            'Returns the length of an object',
            'Sorts the object',
            'Removes elements'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The len() function returns the number of items in an object like a list, string, or dictionary.'
        },
        {
          id: 'python_easy_9',
          question: 'How do you write a comment in Python?',
          options: [
            '// This is a comment',
            '/* This is a comment */',
            '# This is a comment',
            '<!-- This is a comment -->'
          ],
          correctAnswer: 2,
          difficulty: 'easy',
          explanation: 'Python uses the # symbol for single-line comments.'
        },
        {
          id: 'python_easy_10',
          question: 'What is the correct way to check if a key exists in a dictionary?',
          options: [
            'key.exists(dict)',
            'key in dict',
            'dict.hasKey(key)',
            'dict.contains(key)'
          ],
          correctAnswer: 1,
          difficulty: 'easy',
          explanation: 'The "in" operator is used to check if a key exists in a dictionary.'
        },
        // Hard Python Questions
        {
          id: 'python_hard_1',
          question: 'What is the difference between __str__ and __repr__ methods?',
          options: [
            'They are the same',
            '__str__ is for users, __repr__ is for developers',
            '__str__ is for developers, __repr__ is for users',
            'Only __str__ is used'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: '__str__ provides a readable string representation for end users, while __repr__ provides an unambiguous representation for developers.'
        },
        {
          id: 'python_hard_2',
          question: 'What is a Python decorator?',
          options: [
            'A design pattern',
            'A function that modifies another function',
            'A data structure',
            'A loop construct'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'A decorator is a function that takes another function and extends its behavior without explicitly modifying it.'
        },
        {
          id: 'python_hard_3',
          question: 'What is the Global Interpreter Lock (GIL) in Python?',
          options: [
            'A security feature',
            'A mutex that prevents multiple threads from executing Python code simultaneously',
            'A memory management tool',
            'A debugging tool'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once.'
        },
        {
          id: 'python_hard_4',
          question: 'What is the difference between deep copy and shallow copy?',
          options: [
            'No difference',
            'Deep copy creates new objects recursively, shallow copy creates new object but inserts references',
            'Shallow copy is faster',
            'Deep copy only works with lists'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'Deep copy creates new objects recursively, while shallow copy creates a new object but inserts references to objects found in the original.'
        },
        {
          id: 'python_hard_5',
          question: 'What are Python generators?',
          options: [
            'Functions that create random numbers',
            'Functions that return an iterator using yield',
            'Class constructors',
            'Error handlers'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'Generators are functions that return an iterator object and use yield to produce values one at a time, saving memory.'
        },
        {
          id: 'python_hard_6',
          question: 'What is the purpose of *args and **kwargs?',
          options: [
            'To create variables',
            'To handle variable number of arguments',
            'To create decorators',
            'To handle errors'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: '*args allows a function to accept any number of positional arguments, **kwargs allows any number of keyword arguments.'
        },
        {
          id: 'python_hard_7',
          question: 'What is a metaclass in Python?',
          options: [
            'A parent class',
            'A class whose instances are classes',
            'An abstract class',
            'A static class'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'A metaclass is a class whose instances are classes. It defines how classes are constructed.'
        },
        {
          id: 'python_hard_8',
          question: 'What is the difference between is and == operators?',
          options: [
            'They are the same',
            '"is" checks identity, "==" checks equality',
            '"is" checks equality, "==" checks identity',
            'Only == should be used'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: '"is" checks if two variables refer to the same object in memory, while "==" checks if the values are equal.'
        },
        {
          id: 'python_hard_9',
          question: 'What is a context manager in Python?',
          options: [
            'A memory manager',
            'An object that defines methods for use with "with" statement',
            'A thread manager',
            'A process manager'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'A context manager is an object that defines methods __enter__ and __exit__ for use with the "with" statement.'
        },
        {
          id: 'python_hard_10',
          question: 'What is the difference between list and tuple?',
          options: [
            'No difference',
            'Lists are mutable, tuples are immutable',
            'Tuples are faster for all operations',
            'Lists can only store numbers'
          ],
          correctAnswer: 1,
          difficulty: 'hard',
          explanation: 'Lists are mutable (can be changed after creation), while tuples are immutable (cannot be changed after creation).'
        }
      ];
    }
    
    // Default general programming questions
    return [
      // Easy Questions
      {
        id: 'general_easy_1',
        question: 'What is an algorithm?',
        options: [
          'A programming language',
          'A step-by-step procedure to solve a problem',
          'A type of computer',
          'A software application'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'An algorithm is a finite sequence of well-defined instructions to solve a problem or perform a computation.'
      },
      {
        id: 'general_easy_2',
        question: 'What does API stand for?',
        options: [
          'Application Programming Interface',
          'Advanced Programming Instructions',
          'Automated Program Integration',
          'Application Process Interface'
        ],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'API stands for Application Programming Interface, which allows different software applications to communicate with each other.'
      },
      {
        id: 'general_easy_3',
        question: 'What is debugging?',
        options: [
          'Writing new code',
          'Finding and fixing errors in code',
          'Testing software performance',
          'Creating documentation'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'Debugging is the process of finding and fixing bugs or errors in computer program code.'
      },
      {
        id: 'general_easy_4',
        question: 'What is a variable in programming?',
        options: [
          'A constant value',
          'A container for storing data values',
          'A type of loop',
          'A programming language'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'A variable is a storage location with an associated name that contains data which can be modified during program execution.'
      },
      {
        id: 'general_easy_5',
        question: 'What is the purpose of version control?',
        options: [
          'To compile code',
          'To track changes in files over time',
          'To run tests',
          'To deploy applications'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'Version control systems track changes to files over time, allowing developers to collaborate and maintain history of modifications.'
      },
      {
        id: 'general_easy_6',
        question: 'What is a function in programming?',
        options: [
          'A variable',
          'A reusable block of code that performs a specific task',
          'A type of loop',
          'A data structure'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'A function is a reusable block of code that performs a specific task and can be called multiple times in a program.'
      },
      {
        id: 'general_easy_7',
        question: 'What does HTML stand for?',
        options: [
          'Hypertext Markup Language',
          'High Tech Modern Language',
          'Home Tool Markup Language',
          'Hyperlink and Text Markup Language'
        ],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'HTML stands for Hypertext Markup Language, used to create the structure of web pages.'
      },
      {
        id: 'general_easy_8',
        question: 'What is a database?',
        options: [
          'A programming language',
          'An organized collection of data',
          'A web browser',
          'A type of algorithm'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'A database is an organized collection of structured information or data stored electronically in a computer system.'
      },
      {
        id: 'general_easy_9',
        question: 'What is the difference between frontend and backend?',
        options: [
          'No difference',
          'Frontend is what users see, backend handles server-side logic',
          'Frontend is harder to learn',
          'Backend is only for databases'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'Frontend refers to the user interface and user experience, while backend refers to server-side development and logic.'
      },
      {
        id: 'general_easy_10',
        question: 'What is responsive design?',
        options: [
          'Fast loading websites',
          'Design that adapts to different screen sizes',
          'Colorful website design',
          'Interactive animations'
        ],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'Responsive design ensures websites look and function well on various devices and screen sizes.'
      },
      // Hard Questions
      {
        id: 'general_hard_1',
        question: 'What is Big O notation used for?',
        options: [
          'Measuring code quality',
          'Analyzing algorithm efficiency and complexity',
          'Counting lines of code',
          'Measuring memory usage only'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Big O notation describes the performance or complexity of an algorithm in terms of time and space as input size grows.'
      },
      {
        id: 'general_hard_2',
        question: 'What is the difference between SQL and NoSQL databases?',
        options: [
          'No difference',
          'SQL uses structured data with relationships, NoSQL is more flexible with various data models',
          'SQL is newer technology',
          'NoSQL only stores text'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'SQL databases use structured query language and relational models, while NoSQL databases offer flexible schemas for various data types.'
      },
      {
        id: 'general_hard_3',
        question: 'What is microservices architecture?',
        options: [
          'Very small applications',
          'An approach where applications are built as a collection of loosely coupled services',
          'A type of database',
          'A programming paradigm'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Microservices architecture structures an application as a collection of loosely coupled, independently deployable services.'
      },
      {
        id: 'general_hard_4',
        question: 'What is the purpose of load balancing?',
        options: [
          'To reduce code complexity',
          'To distribute incoming requests across multiple servers',
          'To compress files',
          'To encrypt data'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Load balancing distributes incoming network traffic across multiple servers to ensure high availability and reliability.'
      },
      {
        id: 'general_hard_5',
        question: 'What is continuous integration/continuous deployment (CI/CD)?',
        options: [
          'A programming language',
          'A practice of automating integration and deployment of code changes',
          'A type of testing',
          'A database management system'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'CI/CD is a method to frequently deliver apps by introducing automation into the stages of app development.'
      },
      {
        id: 'general_hard_6',
        question: 'What is the difference between authentication and authorization?',
        options: [
          'They are the same',
          'Authentication verifies identity, authorization determines permissions',
          'Authorization verifies identity, authentication determines permissions',
          'Both only handle passwords'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Authentication verifies who you are, while authorization determines what you are allowed to do.'
      },
      {
        id: 'general_hard_7',
        question: 'What is caching and why is it important?',
        options: [
          'Storing files permanently',
          'Storing frequently accessed data in fast storage for quick retrieval',
          'Deleting old data',
          'Backing up data'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Caching stores frequently accessed data in fast storage to reduce access time and improve performance.'
      },
      {
        id: 'general_hard_8',
        question: 'What is the difference between synchronous and asynchronous programming?',
        options: [
          'No difference',
          'Synchronous blocks execution, asynchronous allows concurrent operations',
          'Synchronous is faster',
          'Asynchronous uses more memory'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Synchronous programming executes tasks sequentially, while asynchronous allows multiple operations to run concurrently.'
      },
      {
        id: 'general_hard_9',
        question: 'What is a design pattern in software development?',
        options: [
          'A UI design template',
          'A reusable solution to common problems in software design',
          'A type of algorithm',
          'A testing methodology'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Design patterns are reusable solutions to commonly occurring problems in software design and architecture.'
      },
      {
        id: 'general_hard_10',
        question: 'What is the purpose of unit testing?',
        options: [
          'To test the entire application',
          'To test individual components or functions in isolation',
          'To test user interfaces only',
          'To test network connections'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
        explanation: 'Unit testing involves testing individual components or functions in isolation to ensure they work correctly.'
      }
    ];
  };

  const generateAssessmentQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const courseQuestions = getQuestionsForCourse(courseName);
      
      // Shuffle questions for randomization
      const shuffledQuestions = [...courseQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      
    } catch (error) {
      console.error('Error generating assessment questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate assessment questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === '') return;

    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: parseInt(selectedAnswer)
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    // Save assessment results
    try {
      const supabaseUserId = getSupabaseUserId();
      if (supabaseUserId) {
        await learningService.updateModuleProgress(
          supabaseUserId,
          {
            [courseId]: {
              assessment_attempted: true,
              assessment_passed: passed,
              assessment_score: score,
              assessment_completed_at: passed ? new Date().toISOString() : null
            }
          },
          0,
          0
        );
      }
    } catch (error) {
      console.error('Error saving assessment results:', error);
    }

    setShowResults(true);

    if (passed) {
      generateCertificate(score);
      toast({
        title: "Congratulations!",
        description: `You passed the ${courseName} assessment with ${score}%! Your certificate has been generated.`,
      });
    } else {
      toast({
        title: "Assessment Not Passed",
        description: `You scored ${score}%. You need 70% or higher to pass. Please review the course content and try again.`,
        variant: "destructive"
      });
    }

    onComplete(passed, score);
  };

  const generateCertificate = (score: number) => {
    try {
      const certificateData = {
        userName: user?.fullName || 'Student',
        certificateTitle: `${courseName} Course Completion`,
        completionDate: new Date().toLocaleDateString(),
        score: score,
        verificationCode: `${courseId.toUpperCase()}-${Date.now().toString().slice(-8)}`
      };

      downloadCertificate(certificateData);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Certificate Error",
        description: "Failed to generate certificate, but you've still passed the assessment!",
        variant: "destructive"
      });
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Assessment Locked</h3>
          <p className="text-gray-600 mb-4">
            Complete all course videos to unlock the assessment
          </p>
          <Button onClick={onClose} variant="outline">
            Back to Course
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (generatingQuestions) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-lg font-medium">Preparing your assessment...</p>
          <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const correctAnswers = Object.keys(answers).filter(questionId => {
      const question = questions.find(q => q.id === questionId);
      return question && answers[questionId] === question.correctAnswer;
    }).length;

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {passed ? (
              <Award className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Congratulations!' : 'Assessment Not Passed'}
          </CardTitle>
          <CardDescription>
            {passed 
              ? 'You have successfully passed the course assessment!' 
              : 'You need 70% or higher to pass. Please review and try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <p className="text-gray-600">
              {correctAnswers} out of {questions.length} questions correct
            </p>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Q{index + 1}: {question.question}</p>
                        <Badge variant={question.difficulty === 'easy' ? 'secondary' : 'destructive'}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your answer: {question.options[userAnswer] || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{question.explanation}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {passed && (
              <Button onClick={() => window.location.href = '/student/certificates'}>
                View Certificates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-lg text-gray-600">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{courseName} Assessment</CardTitle>
          <Badge variant={question.difficulty === 'easy' ? 'secondary' : 'destructive'}>
            {question.difficulty}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === ''}
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseAssessment;
