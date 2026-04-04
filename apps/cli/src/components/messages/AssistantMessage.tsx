import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownText } from '../shared/MarkdownText.js';

interface AssistantMessageProps {
  agentId?: string;
  text: string;
  width: number;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ agentId, text }) => {
  return (
    <Box flexDirection="column">
      {agentId && <Text dimColor>[{agentId}]</Text>}
      <Box flexDirection="row">
        <Text color="blue">✦ </Text>
        <Box flexGrow={1} flexDirection="column">
          <MarkdownText text={text} />
        </Box>
      </Box>
    </Box>
  );
};
