import React, { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';
import chalk from 'chalk';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isActive?: boolean;
}

const cursor = chalk.inverse(' ');

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  isActive = true,
}) => {
  const [cursorOffset, setCursorOffset] = useState(value.length);

  useEffect(() => {
    setCursorOffset(value.length);
  }, [value]);

  useInput(
    (input, key) => {
      if (
        key.upArrow ||
        key.downArrow ||
        key.return ||
        key.tab ||
        key.escape ||
        (key.ctrl && input === 'c')
      ) {
        return;
      }

      if (key.leftArrow) {
        setCursorOffset((prev) => Math.max(0, prev - 1));
        return;
      }

      if (key.rightArrow) {
        setCursorOffset((prev) => Math.min(value.length, prev + 1));
        return;
      }

      if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          const next =
            value.slice(0, cursorOffset - 1) + value.slice(cursorOffset);
          onChange(next);
          setCursorOffset((prev) => prev - 1);
        }
        return;
      }

      if (input) {
        const next =
          value.slice(0, cursorOffset) + input + value.slice(cursorOffset);
        onChange(next);
        setCursorOffset((prev) => prev + input.length);
      }
    },
    { isActive },
  );

  if (value.length === 0) {
    const rendered = placeholder.length > 0
      ? chalk.inverse(placeholder[0]!) + chalk.dim(placeholder.slice(1))
      : cursor;
    return <Text>{rendered}</Text>;
  }

  let result = '';
  for (let i = 0; i < value.length; i++) {
    result += i === cursorOffset ? chalk.inverse(value[i]!) : value[i];
  }
  if (cursorOffset === value.length) {
    result += cursor;
  }

  return <Text>{result}</Text>;
};
