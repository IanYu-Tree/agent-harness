export interface LLMConfig {
  apiKey?: string;
  modelId: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}
