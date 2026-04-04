import React from 'react';
import { Box } from 'ink';
import { Spinner } from '@inkjs/ui';

interface SpinnerMessageProps {
  label: string;
}

export const SpinnerMessage: React.FC<SpinnerMessageProps> = ({ label }) => {
  return (
    <Box paddingX={1}>
      <Spinner label={label} />
    </Box>
  );
};
