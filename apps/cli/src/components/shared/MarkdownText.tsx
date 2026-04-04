import React, { useMemo } from 'react';
import { Text } from 'ink';
import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

const marked = new Marked(
  markedTerminal({
    reflowText: true,
    tab: 2,
    width: 80,
  }) as Record<string, unknown>,
);

interface MarkdownTextProps {
  text: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => {
  const rendered = useMemo(() => {
    try {
      const result = marked.parse(text);
      if (typeof result === 'string') {
        return result.replace(/\n$/, '');
      }
      return text;
    } catch {
      return text;
    }
  }, [text]);

  return <Text>{rendered}</Text>;
};
