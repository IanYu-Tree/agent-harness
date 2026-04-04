export interface ConfirmationRequest {
  toolCallId: string;
  toolName: string;
  arguments: string;
  data?: unknown;
}

export interface ConfirmationResult {
  approved: boolean;
  feedback?: string;
}

export type WaitFn = (data?: unknown) => Promise<ConfirmationResult>;

export interface ConfirmationEvent {
  type: 'tool:confirmation';
  timestamp: number;
  agentId: string;
  data: { request: ConfirmationRequest };
}
