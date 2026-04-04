import React from 'react';
import { Box, Text } from 'ink';

interface InfoMessageProps {
  text: string;
  color?: string;
}

export const InfoMessage: React.FC<InfoMessageProps> = ({ text, color }) => {
  return (
    <Box>
      <Text color={color ?? 'cyan'}>ℹ </Text>
      <Text color={color ?? 'cyan'}>{text}</Text>
    </Box>
  );
};
