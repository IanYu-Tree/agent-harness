import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { logStore, type LogEntry } from '../log-store.js';

const MAX_VISIBLE_LOGS = 20;

const LOG_COLORS: Record<string, string> = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'gray',
};

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    return logStore.subscribe(() => {
      setLogs(logStore.getAll().slice(-MAX_VISIBLE_LOGS));
    });
  }, []);

  return (
    <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray" marginTop={1}>
      <Text bold dimColor>Debug Logs ({logs.length})</Text>
      {logs.map((entry, i) => (
        <Text key={i} wrap="truncate" color={LOG_COLORS[entry.level] ?? 'white'}>
          <Text dimColor>[{entry.prefix}]</Text> {entry.message.slice(0, 200)}
        </Text>
      ))}
      {logs.length === 0 && <Text dimColor>No logs yet.</Text>}
    </Box>
  );
};
