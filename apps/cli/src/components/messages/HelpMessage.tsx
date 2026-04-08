import React from 'react';
import { Box, Text } from 'ink';
import type { SlashCommandDef } from '../../types.js';

interface HelpMessageProps {
  commands: SlashCommandDef[];
}

export const HelpMessage: React.FC<HelpMessageProps> = ({ commands }) => {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold>Commands:</Text>
      {commands.map((cmd) => (
        <Text key={cmd.name}>
          <Text>  </Text>
          <Text bold>{cmd.name}</Text>
          <Text>{'  '.padEnd(Math.max(1, 18 - cmd.name.length))}</Text>
          <Text dimColor>- {cmd.description}</Text>
        </Text>
      ))}
    </Box>
  );
};
