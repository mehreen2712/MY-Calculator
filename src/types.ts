export interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
