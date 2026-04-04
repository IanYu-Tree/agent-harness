import { describe, it, expect } from 'vitest';
import { generateId, retry } from '../utils/index.js';

describe('generateId', () => {
  it('should return a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should return unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('retry', () => {
  it('should return result on first success', async () => {
    const result = await retry(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('should retry on failure and succeed', async () => {
    let attempt = 0;
    const result = await retry(
      () => {
        attempt++;
        if (attempt < 3) throw new Error('fail');
        return Promise.resolve('ok');
      },
      { maxRetries: 3, baseDelay: 10 },
    );
    expect(result).toBe('ok');
    expect(attempt).toBe(3);
  });

  it('should throw after max retries', async () => {
    await expect(
      retry(() => Promise.reject(new Error('always fail')), {
        maxRetries: 2,
        baseDelay: 10,
      }),
    ).rejects.toThrow('always fail');
  });
});
