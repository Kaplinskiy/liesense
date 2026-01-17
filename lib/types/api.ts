export interface SessionQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: "A" | "B" | "C"; text: string }[];
}

export interface SessionPayload {
  sessionId: string;
  questionSetId: string;
  score: number;
  questions: SessionQuestion[];
}

export interface AnswerPayload {
  isCorrect: boolean;
  lieOption: "A" | "B" | "C";
  explanation: string;
  correctFact: string;
  stats?: { wrongRate?: number };
}

export interface CompletePayload {
  score: number;
  numCorrect: number;
  errorProfile: { trapType: string; count: number }[];
  streak?: { current: number; updated: boolean };
}
