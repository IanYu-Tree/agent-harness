import type { UserInput } from '@agent-orch/core';
import type OpenAI from 'openai';

type ResponseInputItem = OpenAI.Responses.ResponseInputItem;

export function userInputToResponseInput(userInput: UserInput): ResponseInputItem {
  const contentParts: OpenAI.Responses.ResponseInputContent[] = [];

  for (const item of userInput) {
    if (item.type === 'text') {
      contentParts.push({ type: 'input_text', text: item.text });
    } else if (item.type === 'image_url') {
      contentParts.push({ type: 'input_image', image_url: item.imageUrl.url, detail: 'auto' });
    }
  }

  if (contentParts.length === 1 && contentParts[0].type === 'input_text') {
    return { role: 'user', content: (contentParts[0] as OpenAI.Responses.ResponseInputText).text };
  }

  return { role: 'user', content: contentParts };
}
