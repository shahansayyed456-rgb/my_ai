export type Category = string;

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Question {
  id: string;
  category: Category;
  question: string;
  answer: string;
  difficulty: string;
}

export interface PremiumQuestion extends Question {
  bestAnswer: string;
  beginnerAnswer: string;
  advancedAnswer: string;
  shortAnswer: string;
  detailedAnswer: string;
  realWorldExample?: string;
  commonMistakes?: string;
  followUpQuestions?: string[];
  crossQuestions?: string[];
  interviewerIntention?: string;
  importantKeywords?: string[];
  memoryTrick?: string;
  quickRevisionNotes?: string;
  commands?: string;
  codeExample?: string;
  companyFrequency?: string;
}

export interface UserProgress {
  overallProgress: number;
  readinessScores: {
    technical: number;
    hr: number;
    linux: number;
    aws: number;
    devops: number;
    project: number;
    resume: number;
  };
  weakAreas: string[];
  strongAreas: string[];
  learningStreak: number;
  masteredCount: number;
  needPracticeCount: number;
}
