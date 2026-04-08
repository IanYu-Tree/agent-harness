import type { UserInput } from '@agent-orch/core';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { TextBlockParam, ImageBlockParam } from '@anthropic-ai/sdk/resources/messages';

export function userInputToMessageParam(userInput: UserInput): MessageParam {
  const contentParts: (TextBlockParam | ImageBlockParam)[] = [];

  for (const item of userInput) {
    if (item.type === 'text') {
      contentParts.push({ type: 'text', text: item.text });
    } else if (item.type === 'image_url') {
      contentParts.push({
        type: 'image',
        source: {
          type: 'url',
          url: item.imageUrl.url,
        },
      });
    }
  }

  if (contentParts.length === 1 && contentParts[0].type === 'text') {
    return { role: 'user', content: (contentParts[0] as TextBlockParam).text };
  }

  return { role: 'user', content: contentParts };
}
