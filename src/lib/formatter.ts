import chalk from 'chalk';
import { IssueData } from '../types';

export class OutputFormatter {
  static formatIssue(issue: IssueData): string {
    const output: string[] = [];
    
    // Header
    output.push(chalk.bold.blue(`\n🎯 ${issue.identifier}: ${issue.title}`));
    output.push(chalk.dim(`${issue.url}`));
    output.push('');
    
    // State and assignee
    const stateColor = this.getStateColor(issue.state.name);
    output.push(`${chalk.bold('Status:')} ${chalk.hex(issue.state.color)(issue.state.name)}`);
    
    if (issue.assignee) {
      output.push(`${chalk.bold('Assignee:')} ${issue.assignee.name} (${issue.assignee.email})`);
    }
    
    // Branch name
    output.push(`${chalk.bold('Suggested Branch:')} ${chalk.green(issue.branchName)}`);
    
    // Labels
    if (issue.labels.length > 0) {
      const labelStrings = issue.labels.map(label => 
        chalk.hex(label.color)(label.name)
      );
      output.push(`${chalk.bold('Labels:')} ${labelStrings.join(', ')}`);
    }
    
    // Pull Requests
    if (issue.pullRequests.length > 0) {
      output.push(`${chalk.bold('Pull Requests:')}`);
      issue.pullRequests.forEach(pr => {
        const prStatus = pr.merged ? '✅ Merged' : pr.draft ? '📝 Draft' : '🔄 Open';
        output.push(`  ${prStatus} #${pr.number}: ${pr.title}`);
        output.push(`    ${chalk.dim(pr.url)}`);
      });
    }
    
    output.push('');
    
    // Description
    if (issue.description) {
      output.push(chalk.bold('Description:'));
      output.push(this.formatMarkdown(issue.description));
      output.push('');
    }
    
    // Comments
    if (issue.comments.length > 0) {
      output.push(chalk.bold('Comments:'));
      issue.comments.forEach((comment, index) => {
        output.push(`\n${chalk.bold(`Comment ${index + 1}:`)} ${comment.user.name} (${comment.user.email})`);
        output.push(chalk.dim(`${comment.createdAt.toLocaleString()}`));
        output.push(this.formatMarkdown(comment.body));
      });
    }
    
    // Timestamps
    output.push('');
    output.push(chalk.dim(`Created: ${issue.createdAt.toLocaleString()}`));
    output.push(chalk.dim(`Updated: ${issue.updatedAt.toLocaleString()}`));
    
    return output.join('\n');
  }
  
  private static getStateColor(stateName: string): string {
    const state = stateName.toLowerCase();
    if (state.includes('done') || state.includes('completed')) return 'green';
    if (state.includes('progress') || state.includes('doing')) return 'yellow';
    if (state.includes('todo') || state.includes('backlog')) return 'blue';
    if (state.includes('cancelled') || state.includes('canceled')) return 'red';
    return 'gray';
  }
  
  private static formatMarkdown(text: string): string {
    // Basic markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'))
      .replace(/\*(.*?)\*/g, chalk.italic('$1'))
      .replace(/`(.*?)`/g, chalk.cyan('$1'))
      .replace(/^#{1,6}\s*(.*$)/gm, chalk.bold.underline('$1'))
      .replace(/^-\s*(.*$)/gm, `  • $1`)
      .replace(/^\d+\.\s*(.*$)/gm, `  $1`);
  }
}