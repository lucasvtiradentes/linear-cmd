import { vi } from 'vitest';

export const mockIssue = {
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

export const mockViewer = {
  id: 'viewer-1',
  name: 'Test Viewer',
  email: 'viewer@example.com'
};

export class MockLinearClient {
  constructor(public options: { apiKey: string }) {}

  issue = vi.fn((id: string) => {
    if (id === 'INVALID-123') {
      throw new Error('Entity not found: Issue - Could not find referenced Issue.');
    }
    return Promise.resolve(mockIssue);
  });

  viewer = Promise.resolve(mockViewer);
}

// Mock the @linear/sdk module
vi.mock('@linear/sdk', () => ({
  LinearClient: MockLinearClient
}));
