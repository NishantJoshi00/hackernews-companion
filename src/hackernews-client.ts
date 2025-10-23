/**
 * HackerNewsClient - Main interface for interacting with HackerNews API
 */

import type { FeedType, HackerNewsItem } from './types.js';
import { ItemType } from './types.js';
import { HackerNewsPost } from './hackernews-post.js';

export class HackerNewsClient {
  private readonly baseUrl = 'https://hacker-news.firebaseio.com/v0';

  /**
   * Fetch posts from a specific feed
   * @param feedType - The type of feed to fetch (top, new, best, ask, show, job)
   * @param limit - Maximum number of posts to fetch (default: 30)
   * @returns Array of HackerNewsPost instances
   */
  public async getPosts(feedType: FeedType, limit: number = 30): Promise<HackerNewsPost[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    if (limit > 500) {
      throw new Error('Limit cannot exceed 500');
    }

    const storyIds = await this.fetchStoryIds(feedType);
    const limitedIds = storyIds.slice(0, limit);

    const posts: HackerNewsPost[] = [];

    for (const id of limitedIds) {
      const post = await this.getPost(id);
      if (post !== null) {
        posts.push(post);
      }
    }

    return posts;
  }

  /**
   * Get a specific post by ID
   * @param postId - The ID of the post to fetch
   * @returns HackerNewsPost instance or null if not found
   */
  public async getPost(postId: number): Promise<HackerNewsPost | null> {
    try {
      const response = await fetch(`${this.baseUrl}/item/${postId}.json`);

      if (!response.ok) {
        return null;
      }

      const item = (await response.json()) as HackerNewsItem;

      if (item === null || item.deleted === true || item.dead === true) {
        return null;
      }

      return new HackerNewsPost(item);
    } catch (error) {
      console.error(`Failed to fetch post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Get multiple posts by IDs
   * @param postIds - Array of post IDs to fetch
   * @returns Array of HackerNewsPost instances (skips failed/deleted posts)
   */
  public async getPostsByIds(postIds: number[]): Promise<HackerNewsPost[]> {
    const posts: HackerNewsPost[] = [];

    for (const id of postIds) {
      const post = await this.getPost(id);
      if (post !== null) {
        posts.push(post);
      }
    }

    return posts;
  }

  /**
   * Search for posts by title (client-side filtering)
   * @param feedType - The feed to search in
   * @param query - Search query string
   * @param limit - Maximum number of posts to search through (default: 100)
   * @returns Array of matching HackerNewsPost instances
   */
  public async searchPosts(
    feedType: FeedType,
    query: string,
    limit: number = 100,
  ): Promise<HackerNewsPost[]> {
    const posts = await this.getPosts(feedType, limit);
    const lowerQuery = query.toLowerCase();

    return posts.filter((post) => post.title.toLowerCase().includes(lowerQuery));
  }

  /**
   * Get the latest post ID from HackerNews
   */
  public async getMaxItemId(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/maxitem.json`);

      if (!response.ok) {
        throw new Error('Failed to fetch max item ID');
      }

      const maxId = (await response.json()) as number;
      return maxId;
    } catch (error) {
      throw new Error(`Failed to fetch max item ID: ${String(error)}`);
    }
  }

  /**
   * Get user information by username
   */
  public async getUser(username: string): Promise<{
    id: string;
    created: Date;
    karma: number;
    about: string | null;
    submitted: number[];
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${username}.json`);

      if (!response.ok) {
        return null;
      }

      const user = (await response.json()) as {
        id?: string;
        created?: number;
        karma?: number;
        about?: string;
        submitted?: number[];
      } | null;

      if (user === null) {
        return null;
      }

      return {
        id: user.id ?? username,
        created: new Date((user.created ?? 0) * 1000),
        karma: user.karma ?? 0,
        about: user.about ?? null,
        submitted: user.submitted ?? [],
      };
    } catch (error) {
      console.error(`Failed to fetch user ${username}:`, error);
      return null;
    }
  }

  /**
   * Get posts submitted by a specific user
   * @param username - The username to fetch posts for
   * @param limit - Maximum number of posts to fetch (default: 30)
   * @returns Array of HackerNewsPost instances
   */
  public async getPostsByUser(username: string, limit: number = 30): Promise<HackerNewsPost[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    if (limit > 500) {
      throw new Error('Limit cannot exceed 500');
    }

    const user = await this.getUser(username);

    if (user === null) {
      throw new Error(`User "${username}" not found`);
    }

    const postIds = user.submitted.slice(0, limit);
    const posts: HackerNewsPost[] = [];

    for (const id of postIds) {
      const item = await this.getPost(id);
      // Only include actual posts (stories), not comments
      if (
        item !== null &&
        (item.type === ItemType.STORY || item.type === ItemType.JOB || item.type === ItemType.POLL)
      ) {
        posts.push(item);
        if (posts.length >= limit) {
          break;
        }
      }
    }

    return posts;
  }

  /**
   * Fetch story IDs for a specific feed type
   */
  private async fetchStoryIds(feedType: FeedType): Promise<number[]> {
    const endpoint = `${this.baseUrl}/${feedType}stories.json`;

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${feedType} stories`);
      }

      const storyIds = (await response.json()) as number[];
      return storyIds;
    } catch (error) {
      throw new Error(`Failed to fetch story IDs for ${feedType}: ${String(error)}`);
    }
  }
}
