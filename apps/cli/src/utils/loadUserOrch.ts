import type { AgentOrch, OrchEntry } from '@agent-orch/appkit';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function loadUserOrch(orch: AgentOrch, filePath: string): Promise<OrchEntry> {
  const absolutePath = resolve(filePath);
  const fileUrl = pathToFileURL(absolutePath).href;

  // Clear require cache for hot-reloading support
  const module = await import(fileUrl);

  // Support both default export and named export
  const factory = module.default || module.createOrch || module.orch;

  if (!factory) {
    throw new Error(
      `No valid export found in ${filePath}. ` +
      'Expected default export, named export "createOrch", or "orch".',
    );
  }

  let entry: OrchEntry;

  if (typeof factory === 'function') {
    // If it's a function, call it to get the OrchEntry
    entry = await factory();
  } else {
    // Otherwise assume it's already an OrchEntry
    entry = factory as OrchEntry;
  }

  // Validate the entry has required fields
  if (!entry.id || !entry.name || !entry.config) {
    throw new Error(
      `Invalid orch entry from ${filePath}. ` +
      'Must have id, name, and config properties.',
    );
  }

  orch.registerOrch(entry);

  return entry;
}
