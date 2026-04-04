import React from 'react';
import { Box, Text } from 'ink';

interface ThinkingMessageProps {
  agentId?: string;
  thought: string;
  width: number;
}

export const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ agentId, thought }) => {
  return (
    <Box flexDirection="column">
      {agentId && <Text dimColor>[{agentId}]</Text>}
      <Box
        marginLeft={2}
        paddingLeft={1}
        borderStyle="single"
        borderLeft={true}
        borderRight={false}
        borderTop={false}
        borderBottom={false}
        borderColor="gray"
        flexDirection="column"
      >
        <Text italic dimColor>{thought}</Text>
      </Box>
    </Box>
  );
};
