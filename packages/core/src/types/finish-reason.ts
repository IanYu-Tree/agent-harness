export interface FinishReason {
  type: 'tool' | 'end' | 'error';
  msg?: string;
}
