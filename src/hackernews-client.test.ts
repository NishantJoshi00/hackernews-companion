/**
 * Tests for HackerNewsClient
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { HackerNewsClient } from './hackernews-client.js';
import { FeedType } from './types.js';

describe('HackerNewsClient', () => {
  let client: HackerNewsClient;

  beforeEach(() => {
    client = new HackerNewsClient();
  });

  describe('getPosts', () => {
    test('should fetch top stories with default limit', async () => {
      const posts = await client.getPosts(FeedType.TOP, 5);

      expect(posts).toBeArray();
      expect(posts.length).toBeLessThanOrEqual(5);
      expect(posts.length).toBeGreaterThan(0);

      // Verify structure of first post
      const firstPost = posts[0];
      expect(firstPost).toBeDefined();
      if (firstPost !== undefined) {
        expect(firstPost.id).toBeNumber();
        expect(firstPost.title).toBeString();
        expect(firstPost.author).toBeString();
        expect(firstPost.score).toBeNumber();
        expect(firstPost.time).toBeInstanceOf(Date);
      }
    }, 10000);

    test('should fetch new stories', async () => {
      const posts = await client.getPosts(FeedType.NEW, 3);

      expect(posts).toBeArray();
      expect(posts.length).toBeLessThanOrEqual(3);
      expect(posts.length).toBeGreaterThan(0);
    }, 10000);

    test('should fetch show stories', async () => {
      const posts = await client.getPosts(FeedType.SHOW, 3);

      expect(posts).toBeArray();
      expect(posts.length).toBeLessThanOrEqual(3);
    }, 10000);

    test('should fetch ask stories', async () => {
      const posts = await client.getPosts(FeedType.ASK, 3);

      expect(posts).toBeArray();
      expect(posts.length).toBeLessThanOrEqual(3);
    }, 10000);

    test('should throw error for invalid limit', async () => {
      expect(async () => {
        await client.getPosts(FeedType.TOP, 0);
      }).toThrow('Limit must be greater than 0');

      expect(async () => {
        await client.getPosts(FeedType.TOP, -5);
      }).toThrow('Limit must be greater than 0');
    });

    test('should throw error for limit exceeding 500', async () => {
      expect(async () => {
        await client.getPosts(FeedType.TOP, 501);
      }).toThrow('Limit cannot exceed 500');
    });

    test('should respect custom limit', async () => {
      const posts = await client.getPosts(FeedType.TOP, 2);

      expect(posts.length).toBeLessThanOrEqual(2);
    }, 10000);
  });

  describe('getPost', () => {
    test('should fetch a specific post by ID', async () => {
      // Using a known HN post ID (HN launch post)
      const post = await client.getPost(1);

      expect(post).not.toBeNull();
      if (post !== null) {
        expect(post.id).toBe(1);
        expect(post.title).toBeString();
        expect(post.author).toBeString();
      }
    }, 10000);

    test('should return null for non-existent post', async () => {
      const post = await client.getPost(999999999);

      expect(post).toBeNull();
    }, 10000);

    test('should return null for deleted post', async () => {
      // Note: This test depends on there being a deleted post
      // If no deleted posts exist, this might fail
      const post = await client.getPost(0);

      expect(post).toBeNull();
    }, 10000);
  });

  describe('getPostsByIds', () => {
    test('should fetch multiple posts by IDs', async () => {
      const posts = await client.getPostsByIds([1, 2]);

      expect(posts).toBeArray();
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(2);

      const ids = posts.map((p) => p.id);
      expect(ids).toContain(1);
    }, 10000);

    test('should skip non-existent posts', async () => {
      const posts = await client.getPostsByIds([1, 999999999]);

      expect(posts).toBeArray();
      expect(posts.length).toBe(1);
      if (posts[0] !== undefined) {
        expect(posts[0].id).toBe(1);
      }
    }, 10000);

    test('should return empty array for all invalid IDs', async () => {
      const posts = await client.getPostsByIds([999999999, 999999998]);

      expect(posts).toBeArray();
      expect(posts.length).toBe(0);
    }, 10000);
  });

  describe('searchPosts', () => {
    test('should search posts by title', async () => {
      const posts = await client.searchPosts(FeedType.TOP, 'the', 20);

      expect(posts).toBeArray();
      expect(posts.length).toBeGreaterThan(0);

      // All posts should contain 'the' in title (case insensitive)
      for (const post of posts) {
        expect(post.title.toLowerCase()).toContain('the');
      }
    }, 15000);

    test('should return empty array for no matches', async () => {
      const posts = await client.searchPosts(FeedType.TOP, 'xyzabc123impossible', 20);

      expect(posts).toBeArray();
      expect(posts.length).toBe(0);
    }, 15000);

    test('should be case insensitive', async () => {
      const posts = await client.searchPosts(FeedType.TOP, 'THE', 20);

      expect(posts).toBeArray();
      expect(posts.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('getMaxItemId', () => {
    test('should fetch the maximum item ID', async () => {
      const maxId = await client.getMaxItemId();

      expect(maxId).toBeNumber();
      expect(maxId).toBeGreaterThan(0);
      // HN has been around for a while, should have millions of items
      expect(maxId).toBeGreaterThan(1000000);
    }, 10000);
  });

  describe('getUser', () => {
    test('should fetch user information', async () => {
      // pg (Paul Graham) is a known HN user
      const user = await client.getUser('pg');

      expect(user).not.toBeNull();
      if (user !== null) {
        expect(user.id).toBe('pg');
        expect(user.karma).toBeNumber();
        expect(user.karma).toBeGreaterThan(0);
        expect(user.created).toBeInstanceOf(Date);
        expect(user.submitted).toBeArray();
      }
    }, 10000);

    test('should return null for non-existent user', async () => {
      const user = await client.getUser('thisuserdoesnotexist123456789');

      expect(user).toBeNull();
    }, 10000);
  });

  describe('getPostsByUser', () => {
    test('should fetch posts by username', async () => {
      // pg is a known user with posts
      const posts = await client.getPostsByUser('pg', 5);

      expect(posts).toBeArray();
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(5);

      // All posts should be stories/jobs/polls, not comments
      for (const post of posts) {
        expect(['story', 'job', 'poll']).toContain(post.type);
      }
    }, 15000);

    test('should throw error for non-existent user', async () => {
      await expect(client.getPostsByUser('thisuserdoesnotexist123456789', 10)).rejects.toThrow(
        'User "thisuserdoesnotexist123456789" not found',
      );
    }, 10000);

    test('should throw error for invalid limit', async () => {
      expect(async () => {
        await client.getPostsByUser('pg', 0);
      }).toThrow('Limit must be greater than 0');

      expect(async () => {
        await client.getPostsByUser('pg', -5);
      }).toThrow('Limit must be greater than 0');
    });

    test('should throw error for limit exceeding 500', async () => {
      expect(async () => {
        await client.getPostsByUser('pg', 501);
      }).toThrow('Limit cannot exceed 500');
    });

    test('should respect custom limit', async () => {
      const posts = await client.getPostsByUser('pg', 3);

      expect(posts.length).toBeLessThanOrEqual(3);
    }, 15000);
  });
});
