export class AsyncEventGenerator<T> {
  private eventQueue: T[] = [];
  private isDone: boolean = false;
  private waitingResolvers: ((value: T | undefined) => void)[] = [];
  private taskStatusMap: Record<string, boolean> = {};
  private globalRunning: boolean = true;

  onEvent(event: T) {
    if (this.globalRunning) {
      if (this.waitingResolvers.length > 0) {
        const resolver = this.waitingResolvers.shift()!;
        resolver(event);
      } else {
        this.eventQueue.push(event);
      }
    }
  }

  start(): void {
    this.globalRunning = true;
  }

  done(taskId: string): void {
    if (taskId in this.taskStatusMap) {
      this.taskStatusMap[taskId] = false;
    }
    if (Object.values(this.taskStatusMap).every((status) => !status)) {
      this.globalRunning = false;
      this.isDone = true;
      this.waitingResolvers.forEach((resolver) => {
        resolver(undefined);
      });
      this.waitingResolvers = [];
    }
  }

  stop(): void {
    this.globalRunning = false;
    this.isDone = true;
    this.eventQueue = [];
    this.waitingResolvers.forEach((resolver) => {
      resolver(undefined);
    });
    this.waitingResolvers = [];
  }

  isRunning(taskId: string): boolean {
    if (!taskId) {
      return this.globalRunning;
    }
    return (this.globalRunning && this.taskStatusMap[taskId]) || false;
  }

  async *eventGenerator(taskId: string): AsyncGenerator<T, void, unknown> {
    if (taskId) {
      this.taskStatusMap[taskId] = true;
    }

    try {
      while (this.isRunning(taskId)) {
        if (this.eventQueue.length > 0) {
          yield this.eventQueue.shift()!;
        } else if (!this.isDone) {
          const event = await new Promise<T | undefined>((resolve) => {
            this.waitingResolvers.push(resolve);
          });
          if (event !== undefined) {
            yield event;
          }
        }
      }

      while (this.eventQueue.length > 0) {
        yield this.eventQueue.shift()!;
      }
    } finally {
      if (taskId) {
        this.taskStatusMap[taskId] = false;
        if (Object.values(this.taskStatusMap).every((status) => !status)) {
          this.stop();
        }
      }
    }
  }
}
