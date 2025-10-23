/**
 * TypeScript types and interfaces for HackerNews API
 */

/**
 * Feed types available on HackerNews
 */
export enum FeedType {
  TOP = 'top',
  NEW = 'new',
  BEST = 'best',
  ASK = 'ask',
  SHOW = 'show',
  JOB = 'job',
}

/**
 * Item types returned by HackerNews API
 */
export enum ItemType {
  STORY = 'story',
  COMMENT = 'comment',
  JOB = 'job',
  POLL = 'poll',
  POLLOPT = 'pollopt',
}

/**
 * Raw item from HackerNews API
 * Based on: https://github.com/HackerNews/API
 */
export interface HackerNewsItem {
  id: number;
  deleted?: boolean;
  type?: ItemType;
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

/**
 * Represents a comment on a HackerNews post
 */
export interface Comment {
  id: number;
  author: string;
  text: string;
  time: Date;
  parent: number;
  replies: Comment[];
  deleted: boolean;
  dead: boolean;
}

/**
 * Represents a HackerNews post/story
 */
export interface Post {
  id: number;
  title: string;
  url: string | null;
  author: string;
  score: number;
  time: Date;
  commentCount: number;
  text: string | null;
  type: ItemType;
}

/**
 * Options for fetching posts from a feed
 */
export interface FetchPostsOptions {
  feedType: FeedType;
  limit: number;
}

/**
 * Options for opening URLs in browser
 */
export interface BrowserOptions {
  newTab?: boolean;
}
