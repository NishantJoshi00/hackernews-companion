/**
 * Utility functions for TUI
 */

import type { Comment } from '../types.js';

/**
 * Format time ago from Date
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Extract domain from URL
 */
export function getDomain(url: string | null): string {
  if (url === null) {
    return 'news.ycombinator.com';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Flatten comment tree into a list with depth information
 */
export interface FlatComment extends Comment {
  depth: number;
  isCollapsed: boolean;
}

export function flattenComments(
  comments: Comment[],
  collapsedSet: Set<number>,
  depth: number = 0,
): FlatComment[] {
  const result: FlatComment[] = [];

  for (const comment of comments) {
    const isCollapsed = collapsedSet.has(comment.id);

    result.push({
      ...comment,
      depth,
      isCollapsed,
      replies: [],
    });

    // Only add children if not collapsed
    if (!isCollapsed && comment.replies.length > 0) {
      result.push(...flattenComments(comment.replies, collapsedSet, depth + 1));
    }
  }

  return result;
}

/**
 * Format comment count
 */
export function formatCommentCount(count: number): string {
  if (count === 0) {
    return 'no comments';
  }
  if (count === 1) {
    return '1 comment';
  }
  return `${count} comments`;
}

/**
 * Wrap text to max width
 */
export function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;

    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}
