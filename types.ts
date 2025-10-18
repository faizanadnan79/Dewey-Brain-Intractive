import { HistoryItem as RenamedHistoryItem } from './types';

// Fix: Removed self-referential import which caused naming conflicts.

export interface DebateCandidate {
  number: string;
  name: string;
  confidence: number;
  justification: string;
}

export interface FinalDecision {
  number: string;
  name: string;
  confidence: number;
  finalRationale: string;
  classificationHierarchy?: string;
  buildSteps?: string;
}

export interface EditionHistoryItem {
  edition: string;
  number: string;
  meaning: string;
  status: string; // e.g., 'Active', 'Obsolete', 'Meaning Changed'
}

export interface DebateResult {
  oclcCandidate: DebateCandidate;
  aiCandidates: DebateCandidate[];
  debateAnalysis: string;
  finalDecision: FinalDecision;
  editionHistory?: EditionHistoryItem[];
  worldcatAnalysis?: string;
}

export interface VerificationResult {
  isCorrect: boolean;
  verificationRationale: string;
  providedNumberAnalysis: string;
  correctNumber?: string;
  correctNumberRationale?: string;
  editionUsed: string;
  classificationHierarchy: string;
  buildSteps?: string;
  editionHistory?: EditionHistoryItem[];
  worldcatAnalysis?: string;
}

export interface HistoryItem {
  title: string;
  hint: string;
  mode: 'debate' | 'verify';
  timestamp: string;
  resultData: DebateResult | VerificationResult;
  edition: string;
  // Fix: Added field to store the number that was verified for use in insights.
  ddcNumberToVerify?: string;
}

export interface QuizQuestion {
  q: string;
  o: string[];
  a: number;
  e: string;
}

export interface QuizStage {
  questions: QuizQuestion[];
  userAnswers: any[];
  score: number;
  status: 'locked' | 'active' | 'completed';
}

export interface PracticeQuestion {
    title: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    score: number;
    timeTaken: number;
    result: 'correct' | 'partial' | 'incorrect' | null;
}