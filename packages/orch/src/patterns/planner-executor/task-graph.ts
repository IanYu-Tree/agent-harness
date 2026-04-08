export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TaskNode {
  id: string;
  description: string;
  dependencies: string[];
  executor?: string;
  status: TaskStatus;
  result?: string;
  error?: string;
}

export type TaskInput = Omit<TaskNode, 'status' | 'result' | 'error'>;

export interface TaskSummary {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
}

export class TaskGraph {
  private tasks = new Map<string, TaskNode>();

  addTasks(tasks: TaskInput[]): void {
    for (const task of tasks) {
      this.tasks.set(task.id, {
        ...task,
        status: 'pending',
      });
    }
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [id, task] of this.tasks) {
      for (const dep of task.dependencies) {
        if (!this.tasks.has(dep)) {
          errors.push(`Task "${id}" depends on unknown task "${dep}"`);
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const inDegree = new Map<string, number>();
    for (const id of this.tasks.keys()) {
      inDegree.set(id, 0);
    }
    for (const task of this.tasks.values()) {
      for (const dep of task.dependencies) {
        inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    let visited = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visited++;
      for (const [id, task] of this.tasks) {
        if (task.dependencies.includes(current)) {
          const newDegree = (inDegree.get(id) ?? 1) - 1;
          inDegree.set(id, newDegree);
          if (newDegree === 0) queue.push(id);
        }
      }
    }

    if (visited < this.tasks.size) {
      errors.push('Circular dependency detected in task graph');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  getReadyTasks(): TaskNode[] {
    const ready: TaskNode[] = [];
    for (const task of this.tasks.values()) {
      if (task.status !== 'pending') continue;
      const allDepsDone = task.dependencies.every((dep) => {
        const depTask = this.tasks.get(dep);
        return depTask?.status === 'completed';
      });
      if (allDepsDone) ready.push(task);
    }
    return ready;
  }

  markRunning(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) task.status = 'running';
  }

  markCompleted(taskId: string, result: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
    }
  }

  markFailed(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
    }
  }

  getDependencyResults(taskId: string): Array<{ id: string; description: string; result: string }> {
    const task = this.tasks.get(taskId);
    if (!task) return [];
    return task.dependencies
      .map((dep) => this.tasks.get(dep))
      .filter((t): t is TaskNode => t != null && t.status === 'completed' && t.result != null)
      .map((t) => ({ id: t.id, description: t.description, result: t.result! }));
  }

  getTask(taskId: string): TaskNode | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): TaskNode[] {
    return Array.from(this.tasks.values());
  }

  isAllDone(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status !== 'completed' && task.status !== 'failed') return false;
    }
    return this.tasks.size > 0;
  }

  hasFailures(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === 'failed') return true;
    }
    return false;
  }

  getSummary(): TaskSummary {
    let completed = 0;
    let failed = 0;
    let running = 0;
    let pending = 0;
    for (const task of this.tasks.values()) {
      switch (task.status) {
        case 'completed': completed++; break;
        case 'failed': failed++; break;
        case 'running': running++; break;
        case 'pending': pending++; break;
      }
    }
    return { total: this.tasks.size, completed, failed, running, pending };
  }
}
