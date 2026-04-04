import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';

interface OrchOption {
  id: string;
  name: string;
  description?: string;
}

interface OrchSelectorProps {
  orchs: OrchOption[];
  onSelect: (orchId: string) => void;
  onCancel: () => void;
}

export const OrchSelector: React.FC<OrchSelectorProps> = ({ orchs, onSelect, onCancel }) => {
  const options = [
    ...orchs.map(o => ({
      label: `${o.name}${o.description ? ` - ${o.description}` : ''}`,
      value: o.id,
    })),
    { label: '← Cancel', value: '__cancel__' },
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="yellow">Select orchestration mode:</Text>
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
