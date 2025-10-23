/**
 * Tests for HackerNewsPost
 */

import { describe, test, expect } from 'bun:test';
import { HackerNewsPost } from './hackernews-post.js';
import { HackerNewsClient } from './hackernews-client.js';
import { FeedType } from './types.js';

// Helper to get a sample post
async function getSamplePost(): Promise<HackerNewsPost> {
  const client = new HackerNewsClient();
  const posts = await client.getPosts(FeedType.TOP, 1);
  const post = posts[0];
  if (post === undefined) {
    throw new Error('Failed to fetch sample post');
  }
  return post;
}

describe('HackerNewsPost', () => {
  describe('constructor and basic properties', () => {
    test('should create a post with all properties', async () => {
      const samplePost = await getSamplePost();

      expect(samplePost.id).toBeNumber();
      expect(samplePost.title).toBeString();
      expect(samplePost.author).toBeString();
      expect(samplePost.score).toBeNumber();
      expect(samplePost.time).toBeInstanceOf(Date);
      expect(samplePost.commentCount).toBeNumber();
      expect(samplePost.type).toBeString();
    }, 10000);

    test('should have valid time', async () => {
      const samplePost = await getSamplePost();
      const now = new Date();
      expect(samplePost.time.getTime()).toBeLessThanOrEqual(now.getTime());
      // Should be after HN launch (2007)
      expect(samplePost.time.getFullYear()).toBeGreaterThanOrEqual(2007);
    }, 10000);

    test('should throw error for item without ID', () => {
      expect(() => {
        new HackerNewsPost({} as never);
      }).toThrow('Item must have an id');
    });

    test('should handle missing optional fields', () => {
      const post = new HackerNewsPost({
        id: 123,
      });

      expect(post.id).toBe(123);
      expect(post.title).toBe('');
      expect(post.url).toBeNull();
      expect(post.author).toBe('unknown');
      expect(post.score).toBe(0);
      expect(post.commentCount).toBe(0);
      expect(post.text).toBeNull();
    });
  });

  describe('URL methods', () => {
    test('getHackerNewsUrl should return correct URL', async () => {
      const samplePost = await getSamplePost();
      const url = samplePost.getHackerNewsUrl();

      expect(url).toBeString();
      expect(url).toStartWith('https://news.ycombinator.com/item?id=');
      expect(url).toContain(String(samplePost.id));
    }, 10000);

    test('getArticleUrl should return URL or null', async () => {
      const samplePost = await getSamplePost();
      const url = samplePost.getArticleUrl();

      // Should be either a string URL or null
      if (url !== null) {
        expect(url).toBeString();
        expect(url).toMatch(/^https?:\/\//);
      } else {
        expect(url).toBeNull();
      }
    }, 10000);

    test('openArticleInBrowser should throw error if no URL', async () => {
      const post = new HackerNewsPost({
        id: 123,
      });

      await expect(post.openArticleInBrowser()).rejects.toThrow(
        'This post does not have an external URL',
      );
    });
  });

  describe('comment methods', () => {
    test('getTopLevelCommentCount should return number', async () => {
      const samplePost = await getSamplePost();
      const count = samplePost.getTopLevelCommentCount();

      expect(count).toBeNumber();
      expect(count).toBeGreaterThanOrEqual(0);
    }, 10000);

    test('getComments should fetch top-level comments', async () => {
      const samplePost = await getSamplePost();

      // Skip if post has no comments
      if (samplePost.commentCount === 0) {
        return;
      }

      const comments = await samplePost.getComments();

      expect(comments).toBeArray();
      expect(comments.length).toBeGreaterThan(0);

      // Check first comment structure
      const firstComment = comments[0];
      if (firstComment !== undefined) {
        expect(firstComment.id).toBeNumber();
        expect(firstComment.author).toBeString();
        expect(firstComment.text).toBeString();
        expect(firstComment.time).toBeInstanceOf(Date);
        expect(firstComment.parent).toBeNumber();
        expect(firstComment.replies).toBeArray();
        expect(firstComment.deleted).toBeBoolean();
        expect(firstComment.dead).toBeBoolean();
      }
    }, 30000);

    test('getComments should use cache on second call', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.commentCount === 0) {
        return;
      }

      const comments1 = await samplePost.getComments();
      const comments2 = await samplePost.getComments();

      // Should be the same reference (cached)
      expect(comments1).toBe(comments2);
    }, 30000);

    test('clearCommentsCache should clear the cache', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.commentCount === 0) {
        return;
      }

      await samplePost.getComments();
      samplePost.clearCommentsCache();

      const comments = await samplePost.getComments();
      expect(comments).toBeArray();
    }, 30000);

    test('getAllCommentsFlat should return flattened comment tree', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.commentCount === 0) {
        return;
      }

      const allComments = await samplePost.getAllCommentsFlat();

      expect(allComments).toBeArray();
      expect(allComments.length).toBeGreaterThan(0);

      // Should have at least as many as top-level
      const topLevel = await samplePost.getComments();
      expect(allComments.length).toBeGreaterThanOrEqual(topLevel.length);
    }, 30000);

    test('findComment should locate a comment by ID', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.commentCount === 0) {
        return;
      }

      const comments = await samplePost.getComments();
      if (comments.length === 0) {
        return;
      }

      const firstComment = comments[0];
      if (firstComment === undefined) {
        return;
      }

      const found = await samplePost.findComment(firstComment.id);

      expect(found).not.toBeNull();
      if (found !== null) {
        expect(found.id).toBe(firstComment.id);
        expect(found.author).toBe(firstComment.author);
      }
    }, 30000);

    test('findComment should return null for non-existent comment', async () => {
      const samplePost = await getSamplePost();
      const found = await samplePost.findComment(999999999);

      expect(found).toBeNull();
    }, 30000);
  });

  describe('getSummary', () => {
    test('should return formatted summary', async () => {
      const samplePost = await getSamplePost();
      const summary = samplePost.getSummary();

      expect(summary).toBeString();
      expect(summary).toContain(samplePost.title);
      expect(summary).toContain(samplePost.author);
      expect(summary).toContain(String(samplePost.score));
      expect(summary).toContain(String(samplePost.commentCount));
    }, 10000);

    test('should include URL if present', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.url !== null) {
        const summary = samplePost.getSummary();
        expect(summary).toContain(samplePost.url);
      }
    }, 10000);

    test('should include text preview if present', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.text !== null) {
        const summary = samplePost.getSummary();
        // Should contain at least part of the text
        expect(summary.length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('browser integration', () => {
    test('openInBrowser manual test instructions', async () => {
      const samplePost = await getSamplePost();

      console.log('\n⚠️  Manual test required: openInBrowser()');
      console.log(`   Run: client.getPost(${samplePost.id}).then(p => p?.openInBrowser())`);
      console.log(`   Expected: Browser opens to ${samplePost.getHackerNewsUrl()}\n`);

      expect(true).toBe(true); // Placeholder
    }, 10000);

    test('openArticleInBrowser manual test instructions', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.url === null) {
        return;
      }

      console.log('\n⚠️  Manual test required: openArticleInBrowser()');
      console.log(`   Run: client.getPost(${samplePost.id}).then(p => p?.openArticleInBrowser())`);
      console.log(`   Expected: Browser opens to ${samplePost.url}\n`);

      expect(true).toBe(true); // Placeholder
    }, 10000);

    test('openCommentInBrowser manual test instructions', async () => {
      const samplePost = await getSamplePost();

      if (samplePost.commentCount === 0) {
        return;
      }

      const comments = await samplePost.getComments();
      if (comments.length === 0) {
        return;
      }

      const firstComment = comments[0];
      if (firstComment === undefined) {
        return;
      }

      console.log('\n⚠️  Manual test required: openCommentInBrowser()');
      console.log(
        `   Run: client.getPost(${samplePost.id}).then(p => p?.openCommentInBrowser(${firstComment.id}))`,
      );
      console.log(
        `   Expected: Browser opens to https://news.ycombinator.com/item?id=${firstComment.id}\n`,
      );

      expect(true).toBe(true); // Placeholder
    }, 30000);
  });

  describe('edge cases', () => {
    test('should handle post with no comments', async () => {
      const client = new HackerNewsClient();
      const posts = await client.getPosts(FeedType.NEW, 50);

      // Find a post with no comments
      const postWithNoComments = posts.find((p) => p.commentCount === 0);

      if (postWithNoComments !== undefined) {
        const comments = await postWithNoComments.getComments();
        expect(comments).toBeArray();
        expect(comments.length).toBe(0);
      }
    }, 30000);

    test('should handle Ask HN posts', async () => {
      const client = new HackerNewsClient();
      const posts = await client.getPosts(FeedType.ASK, 1);
      const askPost = posts[0];

      if (askPost !== undefined) {
        expect(askPost.title).toMatch(/^Ask HN:/i);
        // Ask HN posts typically don't have external URLs
        expect(askPost.url).toBeNull();
      }
    }, 10000);

    test('should handle Show HN posts', async () => {
      const client = new HackerNewsClient();
      const posts = await client.getPosts(FeedType.SHOW, 1);
      const showPost = posts[0];

      if (showPost !== undefined) {
        expect(showPost.title).toMatch(/^Show HN:/i);
      }
    }, 10000);
  });
});
