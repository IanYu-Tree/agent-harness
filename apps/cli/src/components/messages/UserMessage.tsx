import React from 'react';
import { Box, Text } from 'ink';

interface UserMessageProps {
  text: string;
  width: number;
}

export const UserMessage: React.FC<UserMessageProps> = ({ text }) => {
  return (
    <Box>
      <Text bold color="green">&gt; </Text>
      <Text wrap="wrap">{text}</Text>
    </Box>
  );
};
