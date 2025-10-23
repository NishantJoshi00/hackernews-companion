/**
 * Event logging types - GitHub-style event tracking for user actions
 */

import type { FeedType } from '../types.js';

/**
 * All possible event types in the application
 */
export enum EventType {
  // Navigation Events
  FEED_CHANGED = 'feed.changed',
  POST_VIEWED = 'post.viewed',
  POST_CLOSED = 'post.closed',
  HELP_OPENED = 'help.opened',
  HELP_CLOSED = 'help.closed',

  // Browser Actions
  ARTICLE_OPENED_BROWSER = 'article.opened_browser',
  POST_OPENED_BROWSER = 'post.opened_browser',
  COMMENT_OPENED_BROWSER = 'comment.opened_browser',

  // Comment Actions
  COMMENT_VIEWED = 'comment.viewed',
  COMMENT_COLLAPSED = 'comment.collapsed',
  COMMENT_EXPANDED = 'comment.expanded',

  // Feed Actions
  FEED_REFRESHED = 'feed.refreshed',
  FEED_LOADED = 'feed.loaded',
  POSTS_LOADED = 'posts.loaded',

  // Search/Filter Actions
  SEARCH_PERFORMED = 'search.performed',
  USER_POSTS_VIEWED = 'user.posts_viewed',

  // App Lifecycle
  APP_STARTED = 'app.started',
  APP_EXITED = 'app.exited',

  // Error Events
  ERROR_OCCURRED = 'error.occurred',
  LOAD_FAILED = 'load.failed',
}

/**
 * Base event interface - all events extend this
 */
export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * Feed changed event
 */
export interface FeedChangedEvent extends BaseEvent {
  type: EventType.FEED_CHANGED;
  metadata: {
    from: FeedType;
    to: FeedType;
  };
}

/**
 * Post viewed in TUI
 */
export interface PostViewedEvent extends BaseEvent {
  type: EventType.POST_VIEWED;
  metadata: {
    postId: number;
    postTitle: string;
    postAuthor: string;
    postScore: number;
    commentCount: number;
  };
}

/**
 * Post closed (went back to feed)
 */
export interface PostClosedEvent extends BaseEvent {
  type: EventType.POST_CLOSED;
  metadata: {
    postId: number;
    postTitle: string;
    timeSpentSeconds: number;
  };
}

/**
 * Article opened in browser
 */
export interface ArticleOpenedBrowserEvent extends BaseEvent {
  type: EventType.ARTICLE_OPENED_BROWSER;
  metadata: {
    postId: number;
    postTitle: string;
    url: string;
  };
}

/**
 * HN post opened in browser
 */
export interface PostOpenedBrowserEvent extends BaseEvent {
  type: EventType.POST_OPENED_BROWSER;
  metadata: {
    postId: number;
    postTitle: string;
    url: string;
  };
}

/**
 * Comment opened in browser
 */
export interface CommentOpenedBrowserEvent extends BaseEvent {
  type: EventType.COMMENT_OPENED_BROWSER;
  metadata: {
    commentId: number;
    commentAuthor: string;
    postId: number;
    postTitle: string;
    url: string;
  };
}

/**
 * Comment viewed
 */
export interface CommentViewedEvent extends BaseEvent {
  type: EventType.COMMENT_VIEWED;
  metadata: {
    commentId: number;
    commentAuthor: string;
    postId: number;
    depth: number;
  };
}

/**
 * Comment collapsed
 */
export interface CommentCollapsedEvent extends BaseEvent {
  type: EventType.COMMENT_COLLAPSED;
  metadata: {
    commentId: number;
    commentAuthor: string;
    replyCount: number;
  };
}

/**
 * Comment expanded
 */
export interface CommentExpandedEvent extends BaseEvent {
  type: EventType.COMMENT_EXPANDED;
  metadata: {
    commentId: number;
    commentAuthor: string;
    replyCount: number;
  };
}

/**
 * Feed refreshed
 */
export interface FeedRefreshedEvent extends BaseEvent {
  type: EventType.FEED_REFRESHED;
  metadata: {
    feedType: FeedType;
  };
}

/**
 * Feed loaded successfully
 */
export interface FeedLoadedEvent extends BaseEvent {
  type: EventType.FEED_LOADED;
  metadata: {
    feedType: FeedType;
    postCount: number;
    loadTimeMs: number;
  };
}

/**
 * Posts loaded for a user
 */
export interface PostsLoadedEvent extends BaseEvent {
  type: EventType.POSTS_LOADED;
  metadata: {
    username: string;
    postCount: number;
  };
}

/**
 * Search performed
 */
export interface SearchPerformedEvent extends BaseEvent {
  type: EventType.SEARCH_PERFORMED;
  metadata: {
    query: string;
    feedType: FeedType;
    resultCount: number;
  };
}

/**
 * User posts viewed
 */
export interface UserPostsViewedEvent extends BaseEvent {
  type: EventType.USER_POSTS_VIEWED;
  metadata: {
    username: string;
    postCount: number;
  };
}

/**
 * Help opened
 */
export interface HelpOpenedEvent extends BaseEvent {
  type: EventType.HELP_OPENED;
  metadata: {
    fromView: 'feed' | 'post';
  };
}

/**
 * Help closed
 */
export interface HelpClosedEvent extends BaseEvent {
  type: EventType.HELP_CLOSED;
  metadata: Record<string, never>;
}

/**
 * App started
 */
export interface AppStartedEvent extends BaseEvent {
  type: EventType.APP_STARTED;
  metadata: {
    terminalWidth: number;
    terminalHeight: number;
  };
}

/**
 * App exited
 */
export interface AppExitedEvent extends BaseEvent {
  type: EventType.APP_EXITED;
  metadata: {
    sessionDurationSeconds: number;
    totalEvents: number;
  };
}

/**
 * Error occurred
 */
export interface ErrorOccurredEvent extends BaseEvent {
  type: EventType.ERROR_OCCURRED;
  metadata: {
    error: string;
    context: string;
  };
}

/**
 * Load failed
 */
export interface LoadFailedEvent extends BaseEvent {
  type: EventType.LOAD_FAILED;
  metadata: {
    what: string;
    error: string;
  };
}

/**
 * Union of all event types
 */
export type AppEvent =
  | FeedChangedEvent
  | PostViewedEvent
  | PostClosedEvent
  | ArticleOpenedBrowserEvent
  | PostOpenedBrowserEvent
  | CommentOpenedBrowserEvent
  | CommentViewedEvent
  | CommentCollapsedEvent
  | CommentExpandedEvent
  | FeedRefreshedEvent
  | FeedLoadedEvent
  | PostsLoadedEvent
  | SearchPerformedEvent
  | UserPostsViewedEvent
  | HelpOpenedEvent
  | HelpClosedEvent
  | AppStartedEvent
  | AppExitedEvent
  | ErrorOccurredEvent
  | LoadFailedEvent;

/**
 * Event storage format
 */
export interface EventLog {
  events: AppEvent[];
  sessionId: string;
  startTime: Date;
  endTime: Date | null;
}

/**
 * Event filter options
 */
export interface EventFilter {
  types?: EventType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Event statistics
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  sessionDuration: number;
  postsViewed: number;
  articlesOpened: number;
  commentsViewed: number;
  feedChanges: number;
}
