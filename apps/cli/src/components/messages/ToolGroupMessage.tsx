import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import type { ToolItemState } from '@agent-orch/appkit';

interface ToolGroupMessageProps {
  agentId?: string;
  tools: ToolItemState[];
  width: number;
}

const ToolStatusIcon: React.FC<{ status: ToolItemState['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending': return <Text color="gray">○ </Text>;
    case 'running': return <><Spinner /><Text> </Text></>;
    case 'success': return <Text color="green">✓ </Text>;
    case 'error': return <Text color="red">✗ </Text>;
  }
};

const ToolItem: React.FC<{ tool: ToolItemState }> = ({ tool }) => {
  const argsSummary = tool.arguments.length > 80
    ? tool.arguments.slice(0, 80) + '…'
    : tool.arguments;

  const resultSummary = tool.result
    ? tool.result.length > 100
      ? tool.result.slice(0, 100) + '…'
      : tool.result
    : undefined;

  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <ToolStatusIcon status={tool.status} />
        <Text bold>{tool.name}</Text>
        {argsSummary && <Text dimColor> {argsSummary}</Text>}
      </Box>
      {resultSummary && tool.status !== 'running' && (
        <Box marginLeft={4}>
          <Text dimColor wrap="truncate">{resultSummary}</Text>
        </Box>
      )}
    </Box>
  );
};

export const ToolGroupMessage: React.FC<ToolGroupMessageProps> = ({ agentId, tools }) => {
  return (
    <Box flexDirection="column">
      {agentId && <Text dimColor>[{agentId}]</Text>}
      {tools.map((tool, i) => (
        <ToolItem key={`${tool.name}-${i}`} tool={tool} />
      ))}
    </Box>
  );
};
