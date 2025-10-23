/**
 * Main TUI Application Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, useInput, useApp, Text } from 'ink';
import { HackerNewsClient } from '../hackernews-client.js';
import type { HackerNewsPost } from '../hackernews-post.js';
import { FeedType } from '../types.js';
import type { AppState } from './types.js';
import { FeedView } from './components/FeedView.js';
import { PostView } from './components/PostView.js';
import { HelpView } from './components/HelpView.js';
import { flattenComments } from './utils.js';
import { EventLogger, EventType } from '../events/index.js';

const client = new HackerNewsClient();
const logger = new EventLogger();

export function App(): React.JSX.Element {
  const { exit } = useApp();
  const appStartTime = useRef<Date>(new Date());
  const previousFeedType = useRef<FeedType>(FeedType.TOP);

  // Initialize logger and log app start
  useEffect(() => {
    logger.initialize().catch(console.error);

    const stdout = process.stdout;
    logger.log(EventType.APP_STARTED, {
      terminalWidth: stdout.columns,
      terminalHeight: stdout.rows,
    });

    return () => {
      // Log app exit and save
      const sessionDuration = Math.floor((Date.now() - appStartTime.current.getTime()) / 1000);
      logger.log(EventType.APP_EXITED, {
        sessionDurationSeconds: sessionDuration,
        totalEvents: logger.getEvents().length,
      });

      logger.save().catch(console.error);

      // Clear screen and move cursor to top
      process.stdout.write('\x1b[2J\x1b[H');
    };
  }, []);

  const [state, setState] = useState<AppState>({
    view: 'feed',
    feedType: FeedType.TOP,
    posts: [],
    selectedPostIndex: 0,
    currentPost: null,
    comments: [],
    flatComments: [],
    selectedCommentIndex: 0,
    collapsedComments: new Set(),
    loading: false,
    error: null,
    statusMessage: null,
  });

  // Load initial feed
  useEffect(() => {
    loadFeed(FeedType.TOP).catch((error: unknown) => {
      console.error('Failed to load initial feed:', error);
    });
  }, []);

  // Load feed function
  const loadFeed = async (feedType: FeedType): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const startTime = Date.now();

    try {
      const posts = await client.getPosts(feedType, 30);
      const loadTime = Date.now() - startTime;

      // Log feed change if different from previous
      if (feedType !== previousFeedType.current) {
        logger.log(EventType.FEED_CHANGED, {
          from: previousFeedType.current,
          to: feedType,
        });
        previousFeedType.current = feedType;
      }

      logger.log(EventType.FEED_LOADED, {
        feedType,
        postCount: posts.length,
        loadTimeMs: loadTime,
      });

      setState((prev) => ({
        ...prev,
        feedType,
        posts,
        loading: false,
        selectedPostIndex: 0,
      }));
    } catch (error) {
      logger.log(EventType.LOAD_FAILED, {
        what: 'feed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      }));
    }
  };

  // Load post details and comments
  const loadPostDetails = async (post: HackerNewsPost): Promise<void> => {
    // Track post viewing time
    logger.trackPostOpened(post.id, post.title);

    logger.log(EventType.POST_VIEWED, {
      postId: post.id,
      postTitle: post.title,
      postAuthor: post.author,
      postScore: post.score,
      commentCount: post.commentCount,
    });

    setState((prev) => ({
      ...prev,
      view: 'post',
      currentPost: post,
      loading: true,
      comments: [],
      flatComments: [],
      selectedCommentIndex: 0,
      collapsedComments: new Set(),
    }));

    try {
      const comments = await post.getComments();
      const flatComments = flattenComments(comments, new Set());

      setState((prev) => ({
        ...prev,
        comments,
        flatComments,
        loading: false,
      }));
    } catch (error) {
      logger.log(EventType.LOAD_FAILED, {
        what: 'comments',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load comments',
      }));
    }
  };

  // Keyboard input handler
  useInput((input, key) => {
    // Global shortcuts
    if (input === 'q' && state.view !== 'help') {
      exit();
      return;
    }

    if (input === 'h' || input === '?') {
      setState((prev) => {
        const isOpening = prev.view !== 'help';
        const fromView = prev.view === 'post' ? 'post' : 'feed';

        if (isOpening) {
          logger.log(EventType.HELP_OPENED, { fromView });
        } else {
          logger.log(EventType.HELP_CLOSED, {});
        }

        return { ...prev, view: prev.view === 'help' ? 'feed' : 'help' };
      });
      return;
    }

    // Feed shortcuts (1-6)
    if (state.view === 'feed') {
      const feedMap: Record<string, FeedType> = {
        '1': FeedType.TOP,
        '2': FeedType.NEW,
        '3': FeedType.BEST,
        '4': FeedType.ASK,
        '5': FeedType.SHOW,
        '6': FeedType.JOB,
      };

      if (input in feedMap) {
        const feedType = feedMap[input];
        if (feedType !== undefined) {
          loadFeed(feedType).catch((error: unknown) => {
            console.error('Failed to load feed:', error);
          });
        }
        return;
      }
    }

    // View-specific handling
    if (state.view === 'help') {
      handleHelpInput(key);
    } else if (state.view === 'feed') {
      handleFeedInput(input, key);
    } else if (state.view === 'post') {
      handlePostInput(input, key);
    }
  });

  // Help view input
  const handleHelpInput = (key: Key): void => {
    if (key.escape) {
      setState((prev) => ({ ...prev, view: 'feed' }));
    }
  };

  // Feed view input
  const handleFeedInput = (input: string, key: Key): void => {
    // Navigation
    if (input === 'j' || key.downArrow) {
      setState((prev) => ({
        ...prev,
        selectedPostIndex: Math.min(prev.selectedPostIndex + 1, prev.posts.length - 1),
      }));
    } else if (input === 'k' || key.upArrow) {
      setState((prev) => ({
        ...prev,
        selectedPostIndex: Math.max(prev.selectedPostIndex - 1, 0),
      }));
    } else if (input === 'g') {
      setState((prev) => ({ ...prev, selectedPostIndex: 0 }));
    } else if (input === 'G') {
      setState((prev) => ({ ...prev, selectedPostIndex: prev.posts.length - 1 }));
    }

    // Actions
    else if (key.return) {
      const selectedPost = state.posts[state.selectedPostIndex];
      if (selectedPost !== undefined) {
        loadPostDetails(selectedPost).catch((error: unknown) => {
          console.error('Failed to load post:', error);
        });
      }
    } else if (input === 'o') {
      const selectedPost = state.posts[state.selectedPostIndex];
      if (selectedPost !== undefined) {
        const url = selectedPost.url ?? selectedPost.getHackerNewsUrl();

        logger.log(EventType.ARTICLE_OPENED_BROWSER, {
          postId: selectedPost.id,
          postTitle: selectedPost.title,
          url,
        });

        selectedPost.openArticleInBrowser().catch((error: unknown) => {
          if (error instanceof Error && error.message.includes('does not have an external URL')) {
            selectedPost.openInBrowser().catch(console.error);
          } else {
            console.error('Failed to open:', error);
          }
        });
      }
    } else if (input === 'c' || input === ' ') {
      const selectedPost = state.posts[state.selectedPostIndex];
      if (selectedPost !== undefined) {
        logger.log(EventType.POST_OPENED_BROWSER, {
          postId: selectedPost.id,
          postTitle: selectedPost.title,
          url: selectedPost.getHackerNewsUrl(),
        });

        selectedPost.openInBrowser().catch(console.error);
      }
    } else if (input === 'r') {
      logger.log(EventType.FEED_REFRESHED, {
        feedType: state.feedType,
      });

      loadFeed(state.feedType).catch(console.error);
    }
  };

  // Post view input
  const handlePostInput = (input: string, key: Key): void => {
    // Navigation
    if (input === 'j' || key.downArrow) {
      setState((prev) => ({
        ...prev,
        selectedCommentIndex: Math.min(prev.selectedCommentIndex + 1, prev.flatComments.length - 1),
      }));
    } else if (input === 'k' || key.upArrow) {
      setState((prev) => ({
        ...prev,
        selectedCommentIndex: Math.max(prev.selectedCommentIndex - 1, 0),
      }));
    } else if (input === 'g') {
      setState((prev) => ({ ...prev, selectedCommentIndex: 0 }));
    } else if (input === 'G') {
      setState((prev) => ({ ...prev, selectedCommentIndex: prev.flatComments.length - 1 }));
    }

    // Collapse/expand
    else if (input === ' ') {
      const selectedComment = state.flatComments[state.selectedCommentIndex];
      if (selectedComment !== undefined) {
        const isCollapsed = state.collapsedComments.has(selectedComment.id);

        logger.log(
          isCollapsed ? EventType.COMMENT_EXPANDED : EventType.COMMENT_COLLAPSED,
          {
            commentId: selectedComment.id,
            commentAuthor: selectedComment.author,
            replyCount: selectedComment.replies.length,
          },
        );

        setState((prev) => {
          const newCollapsed = new Set(prev.collapsedComments);
          if (newCollapsed.has(selectedComment.id)) {
            newCollapsed.delete(selectedComment.id);
          } else {
            newCollapsed.add(selectedComment.id);
          }
          const newFlatComments = flattenComments(prev.comments, newCollapsed);
          return {
            ...prev,
            collapsedComments: newCollapsed,
            flatComments: newFlatComments,
          };
        });
      }
    }

    // Actions
    else if (input === 'o' && state.currentPost !== null) {
      const url = state.currentPost.url ?? state.currentPost.getHackerNewsUrl();

      logger.log(EventType.ARTICLE_OPENED_BROWSER, {
        postId: state.currentPost.id,
        postTitle: state.currentPost.title,
        url,
      });

      state.currentPost.openArticleInBrowser().catch((error: unknown) => {
        if (error instanceof Error && error.message.includes('does not have an external URL')) {
          state.currentPost?.openInBrowser().catch(console.error);
        } else {
          console.error('Failed to open:', error);
        }
      });
    } else if (input === 'c') {
      // Open selected comment in browser
      const selectedComment = state.flatComments[state.selectedCommentIndex];
      if (selectedComment !== undefined && state.currentPost !== null) {
        logger.log(EventType.COMMENT_OPENED_BROWSER, {
          commentId: selectedComment.id,
          commentAuthor: selectedComment.author,
          postId: state.currentPost.id,
          postTitle: state.currentPost.title,
          url: `https://news.ycombinator.com/item?id=${selectedComment.id}`,
        });

        state.currentPost.openCommentInBrowser(selectedComment.id).catch(console.error);
      }
    } else if (key.escape || key.backspace) {
      // Track time spent and log post closed
      const timeSpent = logger.trackPostClosed();

      if (state.currentPost !== null) {
        logger.log(EventType.POST_CLOSED, {
          postId: state.currentPost.id,
          postTitle: state.currentPost.title,
          timeSpentSeconds: timeSpent,
        });
      }

      setState((prev) => ({
        ...prev,
        view: 'feed',
        currentPost: null,
        comments: [],
        flatComments: [],
      }));
    }
  };

  // Render current view
  return (
    <Box flexDirection="column">
      {state.view === 'help' ? <HelpView /> : null}

      {state.view === 'feed' ? (
        <FeedView
          feedType={state.feedType}
          posts={state.posts}
          selectedIndex={state.selectedPostIndex}
          loading={state.loading}
        />
      ) : null}

      {state.view === 'post' && state.currentPost !== null ? (
        <PostView
          post={state.currentPost}
          flatComments={state.flatComments}
          selectedCommentIndex={state.selectedCommentIndex}
          loading={state.loading}
        />
      ) : null}

      {state.error !== null ? (
        <Box paddingX={1}>
          <Text color="red">Error: {state.error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

interface Key {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  backspace: boolean;
}
