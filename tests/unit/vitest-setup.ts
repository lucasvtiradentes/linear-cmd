import { vi } from 'vitest';

// Mock filesystem for config files
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  const mockFileSystem = new Map<string, string>();

  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Always return true for package.json to avoid path resolution issues
      if (path.endsWith('package.json')) return true;
      return mockFileSystem.has(path);
    }),
    readFileSync: vi.fn((path: string) => {
      // Handle package.json specially
      if (path.endsWith('package.json')) {
        return JSON.stringify({
          name: 'linear-cmd',
          version: '1.0.1'
        });
      }
      const content = mockFileSystem.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content;
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      mockFileSystem.set(path, content);
    }),
    mkdirSync: vi.fn()
  };
});

// Mock @linear/sdk globally
vi.mock('@linear/sdk', () => {
  const mockIssue = {
    id: 'issue-123',
    identifier: 'WAY-123',
    title: 'Test Issue',
    description: 'Test description',
    url: 'https://linear.app/test/issue/WAY-123/test-issue',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
    state: Promise.resolve({
      id: 'state-1',
      name: 'In Progress',
      color: '#f59e0b'
    }),
    assignee: Promise.resolve({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }),
    labels: () =>
      Promise.resolve({
        nodes: [
          {
            id: 'label-1',
            name: 'Feature',
            color: '#10b981'
          }
        ]
      }),
    comments: () =>
      Promise.resolve({
        nodes: [
          {
            id: 'comment-1',
            body: 'Test comment',
            createdAt: new Date('2025-01-01'),
            user: Promise.resolve({
              id: 'user-2',
              name: 'Commenter',
              email: 'commenter@example.com'
            })
          }
        ]
      }),
    attachments: () =>
      Promise.resolve({
        nodes: [
          {
            id: 'attachment-1',
            url: 'https://github.com/test/repo/pull/123',
            title: 'Test PR'
          }
        ]
      })
  };

  return {
    LinearClient: vi.fn().mockImplementation((_options: { apiKey: string }) => ({
      issue: vi.fn((id: string) => {
        if (id === 'INVALID-123') {
          throw new Error('Entity not found: Issue - Could not find referenced Issue.');
        }
        return Promise.resolve(mockIssue);
      }),
      viewer: Promise.resolve({
        id: 'viewer-1',
        name: 'Test Viewer',
        email: 'viewer@example.com'
      })
    }))
  };
});
