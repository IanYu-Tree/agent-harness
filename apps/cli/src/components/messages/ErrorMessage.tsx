import React from 'react';
import { Box, Text } from 'ink';

interface ErrorMessageProps {
  text: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text }) => {
  return (
    <Box>
      <Text color="red">✗ </Text>
      <Text color="red">{text}</Text>
    </Box>
  );
};
