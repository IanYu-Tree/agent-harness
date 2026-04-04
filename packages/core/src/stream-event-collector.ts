import type { StreamEvent } from './types/event.js';

export class StreamEventCollector {
  eventBuffer: StreamEvent[] = [];
  observers: {
    observer: (event: StreamEvent) => void;
    filter?: (event: StreamEvent) => boolean;
    subId: string;
  }[] = [];

  subscribe(
    observer: (event: StreamEvent) => void,
    filter?: (event: StreamEvent) => boolean,
  ): string {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.observers.push({ observer, filter, subId });
    return subId;
  }

  unsubscribe(subId: string): void {
    this.observers = this.observers.filter((obs) => obs.subId !== subId);
  }

  publish(event: StreamEvent) {
    this.eventBuffer.push(event);
    this.observers.forEach(({ observer, filter }) => {
      if (!filter || filter(event)) {
        observer(event);
      }
    });
  }

  reset() {
    this.eventBuffer = [];
  }
}
