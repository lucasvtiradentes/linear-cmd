import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface GlobalFixtures {
  projectUrl: string;
  documentUrl: string;
  issueUrl: string;
  accountName: string;
  testHomeDir: string;
}

const FIXTURES_FILE = path.join(os.tmpdir(), 'linear-cmd-e2e-fixtures.json');

export function saveGlobalFixtures(fixtures: GlobalFixtures): void {
  writeFileSync(FIXTURES_FILE, JSON.stringify(fixtures, null, 2));
}

export function loadGlobalFixtures(): GlobalFixtures | null {
  try {
    if (!existsSync(FIXTURES_FILE)) {
      return null;
    }
    const content = readFileSync(FIXTURES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load global fixtures:', error);
    return null;
  }
}

export function clearGlobalFixtures(): void {
  if (existsSync(FIXTURES_FILE)) {
    unlinkSync(FIXTURES_FILE);
  }
}
