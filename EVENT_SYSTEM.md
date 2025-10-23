# Event Logging System

A comprehensive GitHub-style event tracking system that logs all user interactions in the HackerNews TUI.

## Overview

The event system tracks every user action including:
- Navigation between feeds and posts
- Opening articles/posts in browser
- Comment interactions (viewing, collapsing, expanding)
- Feed operations (loading, refreshing)
- App lifecycle events
- Error events

## Architecture

### Event Types (`src/events/types.ts`)

**Navigation Events:**
- `feed.changed` - User switched feeds
- `post.viewed` - User opened a post in TUI
- `post.closed` - User closed a post
- `help.opened` - Help view opened
- `help.closed` - Help view closed

**Browser Actions:**
- `article.opened_browser` - External article opened in browser
- `post.opened_browser` - HN discussion opened in browser
- `comment.opened_browser` - Specific comment opened in browser

**Comment Actions:**
- `comment.viewed` - User navigated to a comment
- `comment.collapsed` - Comment thread collapsed
- `comment.expanded` - Comment thread expanded

**Feed Actions:**
- `feed.refreshed` - User manually refreshed feed
- `feed.loaded` - Feed successfully loaded
- `posts.loaded` - User posts loaded

**App Lifecycle:**
- `app.started` - Application launched
- `app.exited` - Application closed

**Error Events:**
- `error.occurred` - General error
- `load.failed` - Failed to load resource

## EventLogger Class (`src/events/EventLogger.ts`)

### Features

1. **Event Logging**: Track events with metadata
2. **Session Management**: Each app session gets unique ID
3. **Time Tracking**: Calculate time spent viewing posts
4. **Persistent Storage**: Save logs to `~/.hackernews-companion/logs/`
5. **Statistics**: Generate usage statistics
6. **Filtering**: Filter events by type, date range, limit
7. **Formatting**: Human-readable event descriptions

### Usage

```typescript
import { EventLogger, EventType } from './events/index.js';

// Create logger
const logger = new EventLogger();
await logger.initialize();

// Log events
logger.log(EventType.APP_STARTED, {
  terminalWidth: 80,
  terminalHeight: 24
});

logger.log(EventType.POST_VIEWED, {
  postId: 12345,
  postTitle: 'Example Post',
  postAuthor: 'user',
  postScore: 100,
  commentCount: 50
});

// Track post viewing time
logger.trackPostOpened(12345, 'Example Post');
// ... user reads post ...
const timeSpent = logger.trackPostClosed();
logger.log(EventType.POST_CLOSED, {
  postId: 12345,
  postTitle: 'Example Post',
  timeSpentSeconds: timeSpent
});

// Get statistics
const stats = logger.getStats();
console.log(stats);

// Save to disk
await logger.save();

// Load previous sessions
const sessions = await EventLogger.getSessionFiles();
const log = await EventLogger.loadSession(sessions[0]);
```

### Storage Format

Events are stored as JSON in:
```
~/.hackernews-companion/logs/session_{sessionId}_{timestamp}.json
```

Example log file:
```json
{
  "events": [
    {
      "id": "uuid",
      "type": "app.started",
      "timestamp": "2025-01-23T10:30:00.000Z",
      "metadata": {
        "terminalWidth": 120,
        "terminalHeight": 40
      }
    },
    {
      "id": "uuid",
      "type": "post.viewed",
      "timestamp": "2025-01-23T10:30:15.000Z",
      "metadata": {
        "postId": 12345,
        "postTitle": "Example Post",
        "postAuthor": "user",
        "postScore": 100,
        "commentCount": 50
      }
    }
  ],
  "sessionId": "uuid",
  "startTime": "2025-01-23T10:30:00.000Z",
  "endTime": "2025-01-23T11:00:00.000Z"
}
```

## Event Statistics

The logger provides real-time statistics:

```typescript
interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  sessionDuration: number;
  postsViewed: number;
  articlesOpened: number;
  commentsViewed: number;
  feedChanges: number;
}
```

## Integration Points

To integrate into the TUI:

1. Create EventLogger instance in App component
2. Call `logger.log()` for each user action
3. Save logs on app exit
4. (Optional) Create event viewer to display logs in TUI

## Future Enhancements

- Event viewer component in TUI (press 'e' to view)
- Analytics dashboard
- Export to CSV/JSON
- Event replay functionality
- Real-time event streaming
- Event-based notifications
- Usage heatmaps
- Session comparison
