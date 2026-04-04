import type { Message, LLM } from '@agent-orch/core';
import { isEventType } from '@agent-orch/core';

export function isLengthError(msg?: string): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes('context_length_exceeded') ||
    lower.includes('max_tokens') ||
    lower.includes('maximum context length') ||
    lower.includes('too many tokens') ||
    lower.includes('token limit')
  );
}

export function microcompact(
  messages: Message[],
  keepRecentTurns: number = 3,
): Message[] {
  if (messages.length <= keepRecentTurns * 2 + 1) {
    return [...messages];
  }

  const systemMessages: Message[] = [];
  const nonSystemMessages: Message[] = [];

  for (const msg of messages) {
    if (msg.isSystem()) {
      systemMessages.push(msg);
    } else {
      nonSystemMessages.push(msg);
    }
  }

  const recentCount = keepRecentTurns * 2;
  const kept = nonSystemMessages.slice(-recentCount);
  const removed = nonSystemMessages.slice(0, -recentCount);

  const filtered = removed.filter((msg) => {
    return !msg.isToolResult();
  });

  return [...systemMessages, ...filtered, ...kept];
}

export async function compact(
  messages: Message[],
  llm: LLM,
  systemPrompt: string,
): Promise<Message[]> {
  const systemMessages = messages.filter((msg) => msg.isSystem());
  const nonSystemMessages = messages.filter((msg) => !msg.isSystem());

  const summaryInput = [
    { type: 'text' as const, text: 'Summarize the conversation so far in a concise paragraph.' },
  ];

  const gen = llm.runStream({
    messages: [
      llm.messageFactory.system(
        `${systemPrompt}\n\nYou are summarizing a conversation. Provide a brief summary.`,
      ),
      ...nonSystemMessages,
    ],
    userInput: summaryInput,
  });

  let summaryText = '';
  let result: { reason: any; messages: Message[] } | undefined;

  while (true) {
    const { value, done } = await gen.next();
    if (done) {
      result = value as any;
      break;
    }
    if (isEventType(value, 'llm:chunk')) {
      if (value.data.content) {
        summaryText += value.data.content;
      }
    }
  }

  if (!summaryText && result?.messages) {
    return result.messages;
  }

  const summaryMessage = llm.messageFactory.assistant(
    `[Previous conversation summary]: ${summaryText}`,
  );

  return [...systemMessages, summaryMessage];
}
