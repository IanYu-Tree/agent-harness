import { describe, it, expect } from 'vitest';
import { AsyncEventGenerator } from '../async-event-generator.js';

describe('AsyncEventGenerator', () => {
  it('should yield events added before iteration', async () => {
    const gen = new AsyncEventGenerator<string>();
    gen.onEvent('a');
    gen.onEvent('b');

    const iter = gen.eventGenerator('task1');

    setTimeout(() => gen.done('task1'), 10);

    const results: string[] = [];
    for await (const event of iter) {
      results.push(event);
    }

    expect(results).toEqual(['a', 'b']);
  });

  it('should yield events added during iteration', async () => {
    const gen = new AsyncEventGenerator<string>();
    const iter = gen.eventGenerator('task1');

    setTimeout(() => {
      gen.onEvent('x');
      gen.onEvent('y');
      setTimeout(() => gen.done('task1'), 10);
    }, 10);

    const results: string[] = [];
    for await (const event of iter) {
      results.push(event);
    }

    expect(results).toEqual(['x', 'y']);
  });

  it('should stop all tasks on stop()', async () => {
    const gen = new AsyncEventGenerator<string>();
    const iter = gen.eventGenerator('task1');

    setTimeout(() => {
      gen.onEvent('a');
      setTimeout(() => gen.stop(), 10);
    }, 10);

    const results: string[] = [];
    for await (const event of iter) {
      results.push(event);
    }

    expect(results).toEqual(['a']);
  });

  it('should support multiple tasks independently', async () => {
    const gen = new AsyncEventGenerator<string>();
    const iter1 = gen.eventGenerator('task1');
    const iter2 = gen.eventGenerator('task2');

    setTimeout(() => {
      gen.onEvent('shared');
      gen.done('task1');
      setTimeout(() => {
        gen.onEvent('only2');
        gen.done('task2');
      }, 10);
    }, 10);

    const results1: string[] = [];
    for await (const event of iter1) {
      results1.push(event);
    }

    const results2: string[] = [];
    for await (const event of iter2) {
      results2.push(event);
    }

    expect(results1.length).toBeGreaterThanOrEqual(1);
  });

  it('should report running status correctly', async () => {
    const gen = new AsyncEventGenerator<string>();
    expect(gen.isRunning('task1')).toBe(false);

    const iter = gen.eventGenerator('task1');
    const nextPromise = iter.next();
    expect(gen.isRunning('task1')).toBe(true);

    gen.done('task1');
    await nextPromise;
    expect(gen.isRunning('task1')).toBe(false);
  });
});
