export class FeedbackStore {
  feedback: string = '';
  passed: boolean = false;
  round: number = 0;
  executorOutput: string = '';

  setFeedback(feedback: string, passed: boolean): void {
    this.feedback = feedback;
    this.passed = passed;
  }

  getFeedback(): { feedback: string; passed: boolean; round: number } {
    return {
      feedback: this.feedback,
      passed: this.passed,
      round: this.round,
    };
  }

  setExecutorOutput(output: string): void {
    this.executorOutput = output;
  }

  nextRound(): void {
    this.round++;
    this.passed = false;
  }
}
