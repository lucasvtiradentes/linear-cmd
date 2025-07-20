export function parseIssueIdentifier(input: string): string | null {
  if (!input) return null;

  // Handle direct issue ID (e.g., "WORK-123")
  const issueIdPattern = /^[A-Z]+-\d+$/;
  if (issueIdPattern.test(input)) {
    return input;
  }

  // Handle Linear URL
  const urlPattern = /linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/;
  const match = input.match(urlPattern);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}
