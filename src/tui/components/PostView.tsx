/**
 * Post View Component - Post details with comments
 */

import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import type { HackerNewsPost } from '../../hackernews-post.js';
import { timeAgo, getDomain, stripHtml } from '../utils.js';
import type { FlatComment } from '../utils.js';

interface PostViewProps {
  post: HackerNewsPost;
  flatComments: FlatComment[];
  selectedCommentIndex: number;
  loading: boolean;
}

export function PostView({
  post,
  flatComments,
  selectedCommentIndex,
  loading,
}: PostViewProps): React.JSX.Element {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;
  const separator = '─'.repeat(Math.max(0, terminalWidth - 4)); // Account for padding

  // Calculate header lines dynamically
  // Back (1) + divider (1) + title (1-2) + metadata (1) + domain (1) + text (variable) + actions (2) + divider (1) + comments header (1)
  const titleLines = Math.ceil(post.title.length / (terminalWidth - 4));
  const postTextLines = post.text !== null ? Math.min(3, Math.ceil(stripHtml(post.text).slice(0, 200).length / (terminalWidth - 4))) : 0;
  const headerLines = 9 + titleLines + postTextLines;
  const footerLines = 2; // Divider + footer

  // Each comment takes more space due to:
  // - Indentation (reduces effective width)
  // - Author line (1)
  // - Text wrapping (3-5 lines for nested comments)
  // - Spacing (1)
  // Conservative estimate: 7 lines per comment (accounts for deep nesting)
  const linesPerComment = 7;
  const availableLines = Math.max(10, terminalHeight - headerLines - footerLines);
  const maxVisibleComments = Math.max(1, Math.floor(availableLines / linesPerComment));

  // Calculate visible window for comments
  const { startIndex, endIndex } = useMemo(() => {
    if (maxVisibleComments <= 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const half = Math.floor(maxVisibleComments / 2);
    let start = Math.max(0, selectedCommentIndex - half);
    let end = Math.min(flatComments.length, start + maxVisibleComments);

    // Adjust if we're near the end
    if (end - start < maxVisibleComments) {
      start = Math.max(0, end - maxVisibleComments);
    }

    return { startIndex: start, endIndex: end };
  }, [selectedCommentIndex, flatComments.length, maxVisibleComments]);

  const visibleComments = flatComments.slice(startIndex, endIndex);
  const domain = getDomain(post.url);
  const ago = timeAgo(post.time);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Back button */}
      <Box>
        <Text dimColor>← Back</Text>
      </Box>

      <Text dimColor>{separator}</Text>

      {/* Post header */}
      <Box flexDirection="column" paddingY={1}>
        <Text bold>{post.title}</Text>
        <Text dimColor>
          {post.score} points by {post.author} · {post.commentCount} comments · {ago}
        </Text>
        <Text color="blue">{domain}</Text>

        {post.text !== null ? (
          <Box marginTop={1}>
            <Text>{stripHtml(post.text).slice(0, 200)}...</Text>
          </Box>
        ) : null}

        <Box marginTop={1}>
          <Text dimColor>[o] Open article  [c] Open HN discussion</Text>
        </Box>
      </Box>

      <Text dimColor>{separator}</Text>

      {/* Comments header */}
      <Box marginY={1}>
        <Text bold>Comments ({post.commentCount}):</Text>
        {flatComments.length > 0 ? (
          <Text dimColor>
            {' '}
            [{selectedCommentIndex + 1}/{flatComments.length}]
          </Text>
        ) : null}
      </Box>

      {/* Loading state */}
      {loading ? (
        <Box paddingY={1}>
          <Text dimColor>Loading comments...</Text>
        </Box>
      ) : null}

      {/* Comments list - Only visible window */}
      {!loading && visibleComments.length > 0 ? (
        <Box flexDirection="column">
          {visibleComments.map((comment, index) => {
            const actualIndex = startIndex + index;
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                isSelected={actualIndex === selectedCommentIndex}
              />
            );
          })}
        </Box>
      ) : null}

      {/* No comments */}
      {!loading && flatComments.length === 0 ? (
        <Box paddingY={1}>
          <Text dimColor>No comments yet</Text>
        </Box>
      ) : null}

      <Text dimColor>{separator}</Text>

      {/* Footer */}
      <Box>
        <Text dimColor>j/k:navigate  Space:collapse  o:article  c:comment  Esc:back  q:quit</Text>
      </Box>
    </Box>
  );
}

interface CommentItemProps {
  comment: FlatComment;
  isSelected: boolean;
}

function CommentItem({ comment, isSelected }: CommentItemProps): React.JSX.Element {
  const ago = timeAgo(comment.time);
  const indent = '  '.repeat(comment.depth);
  const collapseIcon = comment.isCollapsed ? '▶' : '▼';
  const text = stripHtml(comment.text);

  return (
    <Box flexDirection="column" paddingY={0}>
      <Box>
        <Text>{indent}</Text>
        <Text dimColor>{collapseIcon} </Text>
        {isSelected ? (
          <Text bold inverse>
            {comment.author}
          </Text>
        ) : (
          <Text color="cyan">{comment.author}</Text>
        )}
        <Text dimColor> · {ago}</Text>
        {comment.isCollapsed ? <Text dimColor> [collapsed]</Text> : null}
      </Box>

      {!comment.isCollapsed ? (
        <Box paddingLeft={indent.length + 2}>
          <Text>{text.slice(0, 200)}{text.length > 200 ? '...' : ''}</Text>
        </Box>
      ) : null}

      <Text> </Text>
    </Box>
  );
}
