export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogHandler = (level: LogLevel, prefix: string, message: string) => void;

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let globalMinLevel: LogLevel = 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[globalMinLevel];
}

const defaultHandler: LogHandler = (level, prefix, message) => {
  if (!shouldLog(level)) return;
  const fn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : level === 'debug' ? console.debug
    : console.info;
  fn(`[${prefix}] ${message}`);
};

let globalHandler: LogHandler = defaultHandler;

export function setGlobalLogHandler(handler: LogHandler, minLevel?: LogLevel): void {
  globalHandler = handler;
  if (minLevel) {
    globalMinLevel = minLevel;
  }
}

export function resetGlobalLogHandler(): void {
  globalHandler = defaultHandler;
  globalMinLevel = 'debug';
}

export function setGlobalMinLevel(level: LogLevel): void {
  globalMinLevel = level;
}

export function getGlobalMinLevel(): LogLevel {
  return globalMinLevel;
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2)))
    .join(' ');
}

export function createLogger(prefix: string): Logger {
  const log = (level: LogLevel) => (...args: unknown[]) => {
    globalHandler(level, prefix, formatArgs(args));
  };
  return {
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    debug: log('debug'),
  };
}
