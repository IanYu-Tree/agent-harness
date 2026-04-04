import React from 'react';
import { Box } from 'ink';
import type { HistoryItem } from '../types.js';
import { UserMessage } from './messages/UserMessage.js';
import { AssistantMessage } from './messages/AssistantMessage.js';
import { ThinkingMessage } from './messages/ThinkingMessage.js';
import { ToolGroupMessage } from './messages/ToolGroupMessage.js';
import { InfoMessage } from './messages/InfoMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { HelpMessage } from './messages/HelpMessage.js';
import { SpinnerMessage } from './messages/SpinnerMessage.js';

interface HistoryItemDisplayProps {
  item: HistoryItem;
  width: number;
}

function renderItem(item: HistoryItem, width: number): React.ReactNode {
  switch (item.type) {
    case 'user':
      return <UserMessage text={item.text} width={width} />;
    case 'assistant':
      return <AssistantMessage agentId={item.agentId} text={item.text} width={width} />;
    case 'thinking':
      return <ThinkingMessage agentId={item.agentId} thought={item.thought} width={width} />;
    case 'tool_group':
      return <ToolGroupMessage agentId={item.agentId} tools={item.tools} width={width} />;
    case 'info':
      return <InfoMessage text={item.text} color={item.color} />;
    case 'error':
      return <ErrorMessage text={item.text} />;
    case 'help':
      return <HelpMessage commands={item.commands} />;
    case 'spinner':
      return <SpinnerMessage label={item.label} />;
    default: {
      const _exhaustive: never = item;
      return null;
    }
  }
}

export const HistoryItemDisplay: React.FC<HistoryItemDisplayProps> = ({ item, width }) => {
  return (
    <Box flexDirection="column" width={width}>
      {renderItem(item, width)}
    </Box>
  );
};
