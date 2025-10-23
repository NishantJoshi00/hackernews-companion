/**
 * HackerNewsPost class - Represents a single HackerNews post with full functionality
 */

import type { Comment, HackerNewsItem, ItemType } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HackerNewsPost {
  public readonly id: number;
  public readonly title: string;
  public readonly url: string | null;
  public readonly author: string;
  public readonly score: number;
  public readonly time: Date;
  public readonly commentCount: number;
  public readonly text: string | null;
  public readonly type: ItemType;
  private readonly commentIds: number[];
  private commentsCache: Comment[] | null = null;

  constructor(item: HackerNewsItem) {
    if (item.id === undefined) {
      throw new Error('Item must have an id');
    }

    this.id = item.id;
    this.title = item.title ?? '';
    this.url = item.url ?? null;
    this.author = item.by ?? 'unknown';
    this.score = item.score ?? 0;
    this.time = new Date((item.time ?? 0) * 1000);
    this.commentCount = item.descendants ?? 0;
    this.text = item.text ?? null;
    this.type = (item.type ?? 'story') as ItemType;
    this.commentIds = item.kids ?? [];
  }

  /**
   * Get the HackerNews URL for this post
   */
  public getHackerNewsUrl(): string {
    return `https://news.ycombinator.com/item?id=${this.id}`;
  }

  /**
   * Get the article URL (external link) if it exists
   */
  public getArticleUrl(): string | null {
    return this.url;
  }

  /**
   * Open the HackerNews post in the default browser
   */
  public async openInBrowser(): Promise<void> {
    await this.openUrlInBrowser(this.getHackerNewsUrl());
  }

  /**
   * Open the article URL in the default browser (if it exists)
   */
  public async openArticleInBrowser(): Promise<void> {
    if (this.url === null) {
      throw new Error('This post does not have an external URL');
    }
    await this.openUrlInBrowser(this.url);
  }

  /**
   * Open a specific comment in the browser
   */
  public async openCommentInBrowser(commentId: number): Promise<void> {
    const url = `https://news.ycombinator.com/item?id=${commentId}`;
    await this.openUrlInBrowser(url);
  }

  /**
   * Fetch all comments for this post
   */
  public async getComments(): Promise<Comment[]> {
    if (this.commentsCache !== null) {
      return this.commentsCache;
    }

    const comments: Comment[] = [];

    for (const commentId of this.commentIds) {
      const comment = await this.fetchCommentTree(commentId);
      if (comment !== null) {
        comments.push(comment);
      }
    }

    this.commentsCache = comments;
    return comments;
  }

  /**
   * Get a flat list of all comments (including nested replies)
   */
  public async getAllCommentsFlat(): Promise<Comment[]> {
    const topLevelComments = await this.getComments();
    const allComments: Comment[] = [];

    const flattenComments = (comments: Comment[]): void => {
      for (const comment of comments) {
        allComments.push(comment);
        if (comment.replies.length > 0) {
          flattenComments(comment.replies);
        }
      }
    };

    flattenComments(topLevelComments);
    return allComments;
  }

  /**
   * Find a specific comment by ID
   */
  public async findComment(commentId: number): Promise<Comment | null> {
    const allComments = await this.getAllCommentsFlat();
    return allComments.find((c) => c.id === commentId) ?? null;
  }

  /**
   * Get the number of top-level comments
   */
  public getTopLevelCommentCount(): number {
    return this.commentIds.length;
  }

  /**
   * Clear the comments cache (useful for refreshing)
   */
  public clearCommentsCache(): void {
    this.commentsCache = null;
  }

  /**
   * Fetch a comment and its reply tree from the API
   */
  private async fetchCommentTree(commentId: number): Promise<Comment | null> {
    try {
      const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${commentId}.json`);

      if (!response.ok) {
        return null;
      }

      const item = (await response.json()) as HackerNewsItem;

      if (item === null || item.deleted === true || item.dead === true) {
        return null;
      }

      const replies: Comment[] = [];
      if (item.kids !== undefined && item.kids.length > 0) {
        for (const kidId of item.kids) {
          const reply = await this.fetchCommentTree(kidId);
          if (reply !== null) {
            replies.push(reply);
          }
        }
      }

      return {
        id: item.id ?? 0,
        author: item.by ?? 'unknown',
        text: item.text ?? '',
        time: new Date((item.time ?? 0) * 1000),
        parent: item.parent ?? 0,
        replies,
        deleted: item.deleted ?? false,
        dead: item.dead ?? false,
      };
    } catch (error) {
      console.error(`Failed to fetch comment ${commentId}:`, error);
      return null;
    }
  }

  /**
   * Open a URL in the default browser (cross-platform)
   */
  private async openUrlInBrowser(url: string): Promise<void> {
    const platform = process.platform;

    let command: string;

    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else {
      // Linux and other Unix-like systems
      command = `xdg-open "${url}"`;
    }

    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`Failed to open URL in browser: ${String(error)}`);
    }
  }

  /**
   * Get a summary of the post
   */
  public getSummary(): string {
    const articleUrl = this.url !== null ? ` (${this.url})` : '';
    const textPreview = this.text !== null ? `\n${this.text.slice(0, 100)}...` : '';
    return `[${this.score} points] ${this.title}${articleUrl}\nBy ${this.author} | ${this.commentCount} comments${textPreview}`;
  }
}
