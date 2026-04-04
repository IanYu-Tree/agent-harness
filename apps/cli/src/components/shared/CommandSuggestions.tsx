import React from 'react';
import { Box, Text } from 'ink';
import type { SlashCommandDef } from '../../types.js';

interface CommandSuggestionsProps {
  matches: SlashCommandDef[];
  selectedIndex: number;
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ matches, selectedIndex }) => {
  if (matches.length === 0) return null;

  return (
    <Box flexDirection="column" paddingX={1}>
      {matches.map((cmd, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={cmd.name}>
            <Text color={isSelected ? 'blue' : 'gray'}>
              {isSelected ? '❯ ' : '  '}
            </Text>
            <Text bold={isSelected} color={isSelected ? 'blue' : undefined}>{cmd.name}</Text>
            <Text dimColor>{'  '.padEnd(Math.max(1, 18 - cmd.name.length))}- {cmd.description}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

export function getFilteredCommands(commands: SlashCommandDef[], input: string): SlashCommandDef[] {
  return commands.filter(cmd => cmd.name.toLowerCase().startsWith(input.toLowerCase()));
}
