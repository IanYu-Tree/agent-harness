import { Readable, Writable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import type { AgentOrch } from '@agent-orch/appkit';
import { AgentOrchACP } from './agent-impl.js';

export interface StdioACPServerOptions {
  orch: AgentOrch;
}

export function startStdioACPServer(options: StdioACPServerOptions): void {
  const { orch } = options;

  // Create stdio streams
  const input = Writable.toWeb(process.stdout);
  const output = Readable.toWeb(process.stdin);
  const stream = acp.ndJsonStream(input, output);

  // Create AgentSideConnection
  const connection = new acp.AgentSideConnection(
    (conn) => new AgentOrchACP(orch, conn),
    stream
  );

  // Connection closes automatically when stream ends
  connection.closed.then(() => {
    process.exit(0);
  });
}
