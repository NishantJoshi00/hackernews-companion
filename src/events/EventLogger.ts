/**
 * EventLogger - Tracks and stores all user interactions
 */

import { randomUUID } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  AppEvent,
  EventType,
  EventLog,
  EventFilter,
  EventStats,
  BaseEvent,
} from './types.js';

export class EventLogger {
  private events: AppEvent[] = [];
  private sessionId: string;
  private startTime: Date;
  private storageDir: string;
  private currentPostViewTime: Date | null = null;
  private currentPostId: number | null = null;
  private currentPostTitle: string | null = null;

  constructor() {
    this.sessionId = randomUUID();
    this.startTime = new Date();
    this.storageDir = join(homedir(), '.hackernews-companion', 'logs');
  }

  /**
   * Initialize the logger and create storage directory
   */
  public async initialize(): Promise<void> {
    if (!existsSync(this.storageDir)) {
      await mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Log an event
   */
  public log(type: EventType, metadata: Record<string, unknown> = {}): void {
    const event: BaseEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date(),
      metadata,
    };

    this.events.push(event as AppEvent);

    // Console log for debugging (can be disabled in production)
    if (process.env['DEBUG_EVENTS'] === 'true') {
      console.log(`[EVENT] ${type}:`, metadata);
    }
  }

  /**
   * Track when a post is opened (for calculating time spent)
   */
  public trackPostOpened(postId: number, postTitle: string): void {
    this.currentPostViewTime = new Date();
    this.currentPostId = postId;
    this.currentPostTitle = postTitle;
  }

  /**
   * Track when a post is closed (calculates time spent)
   */
  public trackPostClosed(): number {
    if (
      this.currentPostViewTime === null ||
      this.currentPostId === null ||
      this.currentPostTitle === null
    ) {
      return 0;
    }

    const timeSpent = Math.floor((Date.now() - this.currentPostViewTime.getTime()) / 1000);

    this.currentPostViewTime = null;
    this.currentPostId = null;
    this.currentPostTitle = null;

    return timeSpent;
  }

  /**
   * Get all events
   */
  public getEvents(): AppEvent[] {
    return [...this.events];
  }

  /**
   * Get filtered events
   */
  public getFilteredEvents(filter: EventFilter): AppEvent[] {
    let filtered = [...this.events];

    if (filter.types !== undefined && filter.types.length > 0) {
      filtered = filtered.filter((e) => filter.types?.includes(e.type));
    }

    if (filter.startDate !== undefined) {
      filtered = filtered.filter((e) => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate !== undefined) {
      filtered = filtered.filter((e) => e.timestamp <= filter.endDate!);
    }

    if (filter.limit !== undefined) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Get event statistics
   */
  public getStats(): EventStats {
    const eventsByType: Record<string, number> = {};

    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1;
    }

    const postsViewed =
      this.events.filter((e) => e.type === 'post.viewed').length;

    const articlesOpened =
      this.events.filter((e) => e.type === 'article.opened_browser').length;

    const commentsViewed =
      this.events.filter((e) => e.type === 'comment.viewed').length;

    const feedChanges =
      this.events.filter((e) => e.type === 'feed.changed').length;

    const sessionDuration = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return {
      totalEvents: this.events.length,
      eventsByType,
      sessionDuration,
      postsViewed,
      articlesOpened,
      commentsViewed,
      feedChanges,
    };
  }

  /**
   * Save events to disk
   */
  public async save(): Promise<void> {
    await this.initialize();

    const log: EventLog = {
      events: this.events,
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: new Date(),
    };

    const filename = `session_${this.sessionId}_${this.startTime.toISOString().replace(/:/g, '-')}.json`;
    const filepath = join(this.storageDir, filename);

    await writeFile(filepath, JSON.stringify(log, null, 2), 'utf-8');
  }

  /**
   * Load events from a session file
   */
  public static async loadSession(filepath: string): Promise<EventLog | null> {
    try {
      const content = await readFile(filepath, 'utf-8');
      const log = JSON.parse(content) as EventLog;

      // Convert date strings back to Date objects
      log.startTime = new Date(log.startTime);
      log.endTime = log.endTime !== null ? new Date(log.endTime) : null;

      for (const event of log.events) {
        event.timestamp = new Date(event.timestamp);
      }

      return log;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Get all session files
   */
  public static async getSessionFiles(): Promise<string[]> {
    const storageDir = join(homedir(), '.hackernews-companion', 'logs');

    if (!existsSync(storageDir)) {
      return [];
    }

    const fs = await import('fs/promises');
    const files = await fs.readdir(storageDir);

    return files
      .filter((f) => f.startsWith('session_') && f.endsWith('.json'))
      .map((f) => join(storageDir, f));
  }

  /**
   * Clear all events (for current session)
   */
  public clear(): void {
    this.events = [];
  }

  /**
   * Get session info
   */
  public getSessionInfo(): { sessionId: string; startTime: Date; eventCount: number } {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      eventCount: this.events.length,
    };
  }

  /**
   * Format event for display
   */
  public static formatEvent(event: AppEvent): string {
    const time = event.timestamp.toLocaleTimeString();
    const type = event.type;

    switch (event.type) {
      case 'post.viewed':
        return `[${time}] Viewed post: "${event.metadata.postTitle}"`;

      case 'post.closed':
        return `[${time}] Closed post: "${event.metadata.postTitle}" (${event.metadata.timeSpentSeconds}s)`;

      case 'article.opened_browser':
        return `[${time}] Opened article in browser: "${event.metadata.postTitle}"`;

      case 'post.opened_browser':
        return `[${time}] Opened HN discussion in browser: "${event.metadata.postTitle}"`;

      case 'comment.opened_browser':
        return `[${time}] Opened comment in browser by ${event.metadata.commentAuthor}`;

      case 'comment.collapsed':
        return `[${time}] Collapsed comment by ${event.metadata.commentAuthor}`;

      case 'comment.expanded':
        return `[${time}] Expanded comment by ${event.metadata.commentAuthor}`;

      case 'feed.changed':
        return `[${time}] Changed feed from ${event.metadata.from} to ${event.metadata.to}`;

      case 'feed.refreshed':
        return `[${time}] Refreshed ${event.metadata.feedType} feed`;

      case 'feed.loaded':
        return `[${time}] Loaded ${event.metadata.postCount} posts from ${event.metadata.feedType} (${event.metadata.loadTimeMs}ms)`;

      case 'app.started':
        return `[${time}] App started (${event.metadata.terminalWidth}x${event.metadata.terminalHeight})`;

      case 'app.exited':
        return `[${time}] App exited (${event.metadata.sessionDurationSeconds}s, ${event.metadata.totalEvents} events)`;

      default:
        return `[${time}] ${type}`;
    }
  }
}
