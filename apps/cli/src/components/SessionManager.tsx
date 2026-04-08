import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import type { SessionSummary } from '@agent-orch/appkit';

interface SessionManagerProps {
  mode: 'load' | 'delete';
  sessions: SessionSummary[];
  onSelect: (sessionId: string) => void;
  onCancel: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ mode, sessions, onSelect, onCancel }) => {
  const title = mode === 'load' ? 'Load session:' : 'Delete session:';
  const color = mode === 'load' ? 'yellow' : 'red';

  if (sessions.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={color}>No sessions found.</Text>
      </Box>
    );
  }

  const options = [
    ...sessions.map(s => ({
      label: `${s.title} (${s.messageCount} msgs, ${new Date(s.updatedAt).toLocaleString()})`,
      value: s.id,
    })),
    { label: '← Cancel', value: '__cancel__' },
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color={color}>{title}</Text>
      <Select
        options={options}
        onChange={(value) => {
          if (value === '__cancel__') {
            onCancel();
          } else {
            onSelect(value);
          }
        }}
      />
    </Box>
  );
};
