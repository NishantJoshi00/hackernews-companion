/**
 * Feed View Component - Main list of posts
 */

import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import type { HackerNewsPost } from '../../hackernews-post.js';
import type { FeedType } from '../../types.js';
import { timeAgo, getDomain, formatCommentCount } from '../utils.js';

interface FeedViewProps {
  feedType: FeedType;
  posts: HackerNewsPost[];
  filteredPosts: HackerNewsPost[];
  selectedIndex: number;
  loading: boolean;
  searchQuery: string;
  isSearchMode: boolean;
  onSearchChange: (value: string) => void;
}

export function FeedView({
  feedType,
  posts,
  filteredPosts,
  selectedIndex,
  loading,
  searchQuery,
  isSearchMode,
  onSearchChange,
}: FeedViewProps): React.JSX.Element {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;
  const separator = '─'.repeat(Math.max(0, terminalWidth - 4)); // Account for padding

  // Calculate visible window
  // Reserve lines for header/footer (add 2 more if search/filter is showing)
  const reservedLines = isSearchMode || searchQuery ? 7 : 5;
  const maxVisiblePosts = Math.floor((terminalHeight - reservedLines) / 3); // Each post takes ~3 lines

  const { startIndex, endIndex } = useMemo(() => {
    const half = Math.floor(maxVisiblePosts / 2);
    let start = Math.max(0, selectedIndex - half);
    let end = Math.min(filteredPosts.length, start + maxVisiblePosts);

    // Adjust if we're near the end
    if (end - start < maxVisiblePosts) {
      start = Math.max(0, end - maxVisiblePosts);
    }

    return { startIndex: start, endIndex: end };
  }, [selectedIndex, filteredPosts.length, maxVisiblePosts]);

  const visiblePosts = filteredPosts.slice(startIndex, endIndex);
  const feedLabels: Record<FeedType, string> = {
    top: 'Top Stories',
    new: 'New Stories',
    best: 'Best Stories',
    ask: 'Ask HN',
    show: 'Show HN',
    job: 'Jobs',
  };

  const feedLabel = feedLabels[feedType];

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          HN: {feedLabel}
        </Text>
        <Text dimColor> ({filteredPosts.length}{searchQuery ? `/${posts.length}` : ''})</Text>
        <Box flexGrow={1} />
        <Text dimColor>
          [{selectedIndex + 1}/{filteredPosts.length}]
        </Text>
      </Box>

      <Text dimColor>{separator}</Text>

      {/* Search Bar */}
      {isSearchMode ? (
        <Box>
          <Text color="yellow">Search: </Text>
          <TextInput value={searchQuery} onChange={onSearchChange} />
        </Box>
      ) : searchQuery ? (
        <Box>
          <Text color="yellow">Filter: </Text>
          <Text color="cyan">{searchQuery}</Text>
          <Text dimColor> (press / to edit, Esc to clear)</Text>
        </Box>
      ) : null}

      {/* Loading State */}
      {loading && posts.length === 0 ? (
        <Box paddingY={2}>
          <Text dimColor>Loading posts...</Text>
        </Box>
      ) : null}

      {/* Posts List - Only visible window */}
      {visiblePosts.length > 0 ? (
        <Box flexDirection="column">
          {visiblePosts.map((post, index) => {
            const actualIndex = startIndex + index;
            return (
              <PostItem
                key={post.id}
                post={post}
                rank={actualIndex + 1}
                isSelected={actualIndex === selectedIndex}
              />
            );
          })}
        </Box>
      ) : null}

      {/* No Posts */}
      {!loading && filteredPosts.length === 0 ? (
        <Box paddingY={2}>
          <Text dimColor>{searchQuery ? 'No matching posts' : 'No posts found'}</Text>
        </Box>
      ) : null}

      <Text dimColor>{separator}</Text>

      {/* Footer */}
      <Box>
        <Text dimColor>j/k:navigate  Enter:view  o:open  /:search  Space:HN  h:help  q:quit  1-6:feeds</Text>
      </Box>
    </Box>
  );
}

interface PostItemProps {
  post: HackerNewsPost;
  rank: number;
  isSelected: boolean;
}

function PostItem({ post, rank, isSelected }: PostItemProps): React.JSX.Element {
  const domain = getDomain(post.url);
  const ago = timeAgo(post.time);
  const comments = formatCommentCount(post.commentCount);

  return (
    <Box flexDirection="column" paddingY={0}>
      {/* Main line */}
      <Box>
        <Text dimColor>{rank}. </Text>
        <Text color="cyan">[{post.score}↑]</Text>
        <Text> </Text>
        <Text bold={isSelected} inverse={isSelected}>
          {post.title}
        </Text>
      </Box>

      {/* Metadata line */}
      <Box paddingLeft={4}>
        <Text dimColor>
          └─ {domain} · {comments} · {ago}
        </Text>
      </Box>

      {isSelected ? <Text> </Text> : null}
    </Box>
  );
}
