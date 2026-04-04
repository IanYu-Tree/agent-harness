import { describe, it, expect, vi } from 'vitest';
import { StreamEventCollector } from '../stream-event-collector.js';
import type { StreamEvent } from '../types/event.js';

function createEvent(type: string, data: unknown = {}): StreamEvent {
  return { type: type as StreamEvent['type'], timestamp: Date.now(), data } as StreamEvent;
}

describe('StreamEventCollector', () => {
  it('should publish events to subscribers', () => {
    const collector = new StreamEventCollector();
    const handler = vi.fn();
    collector.subscribe(handler);

    const event = createEvent('llm:chunk', { content: 'hello' });
    collector.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should buffer published events', () => {
    const collector = new StreamEventCollector();
    const event1 = createEvent('llm:start');
    const event2 = createEvent('llm:end');

    collector.publish(event1);
    collector.publish(event2);

    expect(collector.eventBuffer).toHaveLength(2);
    expect(collector.eventBuffer[0]).toBe(event1);
    expect(collector.eventBuffer[1]).toBe(event2);
  });

  it('should filter events for subscribers', () => {
    const collector = new StreamEventCollector();
    const handler = vi.fn();
    const filter = (event: StreamEvent) => event.type === 'llm:chunk';
    collector.subscribe(handler, filter);

    collector.publish(createEvent('llm:start'));
    collector.publish(createEvent('llm:chunk', { content: 'hi' }));
    collector.publish(createEvent('llm:end'));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].type).toBe('llm:chunk');
  });

  it('should unsubscribe by subId', () => {
    const collector = new StreamEventCollector();
    const handler = vi.fn();
    const subId = collector.subscribe(handler);

    collector.publish(createEvent('llm:start'));
    expect(handler).toHaveBeenCalledTimes(1);

    collector.unsubscribe(subId);
    collector.publish(createEvent('llm:end'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support multiple subscribers', () => {
    const collector = new StreamEventCollector();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    collector.subscribe(handler1);
    collector.subscribe(handler2);

    collector.publish(createEvent('llm:start'));

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should reset event buffer', () => {
    const collector = new StreamEventCollector();
    collector.publish(createEvent('llm:start'));
    collector.publish(createEvent('llm:end'));
    expect(collector.eventBuffer).toHaveLength(2);

    collector.reset();
    expect(collector.eventBuffer).toHaveLength(0);
  });
});
