import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Spinner } from '@inkjs/ui';
import type { SlashCommandDef } from '../types.js';
import { CommandSuggestions, getFilteredCommands } from './shared/CommandSuggestions.js';
import { TextInput } from './shared/TextInput.js';

interface ComposerProps {
  onSubmit: (value: string) => void;
  isStreaming: boolean;
  orchName: string;
  sessionTitle?: string;
  commands: SlashCommandDef[];
  queuedMessage: string | null;
  onQueue: (msg: string) => void;
  placeholder?: string;
  prompt?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit,
  isStreaming,
  orchName,
  sessionTitle,
  commands,
  queuedMessage,
  onQueue,
  placeholder = 'Type a message or /help...',
  prompt,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const showSuggestions = inputValue.startsWith('/') && inputValue.length > 0 && !isStreaming;
  const filteredCommands = showSuggestions ? getFilteredCommands(commands, inputValue) : [];

  useEffect(() => {
    setSuggestionIndex(0);
  }, [inputValue]);

  const submit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setInputValue('');
  }, [onSubmit]);

  useInput((input, key) => {
    if (isStreaming) return;

    if (key.return) {
      if (showSuggestions && filteredCommands.length > 0) {
        const selected = filteredCommands[suggestionIndex];
        if (selected) {
          submit(selected.name);
          return;
        }
      }
      submit(inputValue);
      return;
    }

    if (showSuggestions && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSuggestionIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSuggestionIndex(prev => Math.min(filteredCommands.length - 1, prev + 1));
        return;
      }
      if (key.tab) {
        const selected = filteredCommands[suggestionIndex];
        if (selected) {
          setInputValue(selected.name);
        }
        return;
      }
    }

    if (key.escape) {
      if (inputValue.length > 0) {
        setInputValue('');
      }
      return;
    }
  }, { isActive: !isStreaming });

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text dimColor>
          {orchName}
          {sessionTitle ? ` · ${sessionTitle}` : ''}
          {isStreaming ? ' · streaming' : ''}
        </Text>
      </Box>

      {showSuggestions && filteredCommands.length > 0 && (
        <CommandSuggestions
          matches={filteredCommands}
          selectedIndex={suggestionIndex}
        />
      )}

      {queuedMessage && (
        <Box paddingX={1}>
          <Text color="yellow">⏳ Queued: </Text>
          <Text dimColor>{queuedMessage}</Text>
        </Box>
      )}

      <Box paddingX={1}>
        {isStreaming ? (
          <Box>
            <Text color="blue">✦ </Text>
            <Spinner label="AI is responding..." />
          </Box>
        ) : (
          <>
            {prompt ? (
              <Text bold color="yellow">{prompt} </Text>
            ) : (
              <Text bold color="green">&gt; </Text>
            )}
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              placeholder={placeholder}
              isActive={!isStreaming}
            />
          </>
        )}
      </Box>
    </Box>
  );
};
