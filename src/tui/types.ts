/**
 * Types for TUI components
 */

import type { HackerNewsPost } from '../hackernews-post.js';
import type { Comment, FeedType } from '../types.js';
import type { FlatComment } from './utils.js';

export type View = 'feed' | 'post' | 'help';

export interface AppState {
  view: View;
  feedType: FeedType;
  posts: HackerNewsPost[];
  selectedPostIndex: number;
  currentPost: HackerNewsPost | null;
  comments: Comment[];
  flatComments: FlatComment[];
  selectedCommentIndex: number;
  collapsedComments: Set<number>;
  loading: boolean;
  error: string | null;
  statusMessage: string | null;
}

export interface FeedInfo {
  type: FeedType;
  label: string;
  key: string;
}
