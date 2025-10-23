/**
 * Basic usage examples for HackerNews Companion
 */

import { HackerNewsClient, FeedType } from '../src/index.js';

async function main(): Promise<void> {
  const client = new HackerNewsClient();

  console.log('=== HackerNews Companion Examples ===\n');

  // Example 1: Get top posts
  console.log('1. Fetching top 5 posts...');
  const topPosts = await client.getPosts(FeedType.TOP, 5);

  for (const post of topPosts) {
    console.log(`   [${post.score}] ${post.title}`);
    console.log(`   By: ${post.author} | Comments: ${post.commentCount}`);
    console.log(`   URL: ${post.getHackerNewsUrl()}\n`);
  }

  // Example 2: Get a specific post
  console.log('2. Fetching specific post...');
  const specificPost = await client.getPost(1);

  if (specificPost !== null) {
    console.log(`   Title: ${specificPost.title}`);
    console.log(`   Author: ${specificPost.author}`);
    console.log(`   Score: ${specificPost.score}`);
    console.log(`   Comments: ${specificPost.commentCount}\n`);
  }

  // Example 3: Get comments from the first top post
  console.log('3. Fetching comments from the first top post...');
  const firstPost = topPosts[0];

  if (firstPost !== undefined && firstPost.commentCount > 0) {
    const comments = await firstPost.getComments();
    console.log(`   Found ${comments.length} top-level comments\n`);

    if (comments.length > 0) {
      const firstComment = comments[0];
      if (firstComment !== undefined) {
        console.log(`   First comment by ${firstComment.author}:`);
        const preview = firstComment.text.slice(0, 100).replace(/\n/g, ' ');
        console.log(`   "${preview}..."\n`);
      }
    }
  }

  // Example 4: Search for posts
  console.log('4. Searching for posts containing "AI"...');
  const searchResults = await client.searchPosts(FeedType.TOP, 'AI', 20);
  console.log(`   Found ${searchResults.length} posts\n`);

  for (const post of searchResults.slice(0, 3)) {
    console.log(`   - ${post.title}`);
  }

  // Example 5: Client-side filtering (filter posts by score)
  console.log('\n5. Filtering posts with score > 200...');
  const allPosts = await client.getPosts(FeedType.TOP, 20);
  const highScorePosts = allPosts.filter((post) => post.score > 200);
  console.log(`   Found ${highScorePosts.length} posts with score > 200\n`);

  // Example 6: Get Ask HN posts
  console.log('6. Fetching Ask HN posts...');
  const askPosts = await client.getPosts(FeedType.ASK, 3);

  for (const post of askPosts) {
    console.log(`   ${post.title}`);
    console.log(`   ${post.commentCount} comments\n`);
  }

  // Example 7: Get user info
  console.log('7. Fetching user info for "pg"...');
  const user = await client.getUser('pg');

  if (user !== null) {
    console.log(`   Username: ${user.id}`);
    console.log(`   Karma: ${user.karma}`);
    console.log(`   Created: ${user.created.toDateString()}`);
    console.log(`   Total submissions: ${user.submitted.length}\n`);
  }

  // Example 8: Get posts by username
  console.log('8. Fetching posts by user "pg"...');
  const userPosts = await client.getPostsByUser('pg', 5);
  console.log(`   Found ${userPosts.length} posts\n`);

  for (const post of userPosts) {
    console.log(`   [${post.score}] ${post.title}`);
  }

  console.log('\n=== Examples Complete ===');
}

main().catch((error: unknown) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
