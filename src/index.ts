/**
 * HackerNews Companion - Main Entry Point
 *
 * This is the main export file for the HackerNews Companion library.
 * Import the classes and types you need from this file.
 */

// Export main classes
export { HackerNewsClient } from './hackernews-client.js';
export { HackerNewsPost } from './hackernews-post.js';

// Export all types
export type { Comment, Post, HackerNewsItem, FetchPostsOptions, BrowserOptions } from './types.js';
export { FeedType, ItemType } from './types.js';

/**
 * Example usage:
 *
 * ```typescript
 * import { HackerNewsClient, FeedType } from './index.js';
 *
 * const client = new HackerNewsClient();
 *
 * // Get top 10 posts
 * const posts = await client.getPosts(FeedType.TOP, 10);
 *
 * // Get a specific post
 * const post = await client.getPost(123456);
 *
 * // Get comments from a post
 * if (post !== null) {
 *   const comments = await post.getComments();
 *   console.log(`Found ${comments.length} top-level comments`);
 *
 *   // Open post in browser
 *   await post.openInBrowser();
 *
 *   // Open article in browser (if it has an external URL)
 *   if (post.url !== null) {
 *     await post.openArticleInBrowser();
 *   }
 * }
 * ```
 */
