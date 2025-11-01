# HackerNews Companion

A terminal user interface (TUI) for browsing HackerNews, built with TypeScript, React, and Ink.

## Features

- **Browse Multiple Feeds**: Top, New, Best, Ask HN, Show HN, and Jobs
- **Interactive TUI**: Vim-style keyboard navigation
- **Search**: Filter posts and comments in real-time
- **Comment Threading**: Collapsible comment threads with full nesting support
- **Browser Integration**: Open articles and comments directly in your browser
- **Event Logging**: Track your browsing activity and session metrics
- **TypeScript API**: Use the HackerNews client programmatically in your own projects

## Installation

```bash
# Install dependencies
bun install

# Run the TUI
bun run tui

# Or compile to a standalone binary
bun run compile
./hn-companion
```

## Usage

### TUI Application

Launch the interactive terminal interface:

```bash
bun run tui
```

### Keyboard Shortcuts

#### Global
- `h` or `?` - Toggle help view
- `q` - Quit application

#### Feed View
- `1-6` - Switch feeds (Top, New, Best, Ask, Show, Jobs)
- `j` or `↓` - Move down
- `k` or `↑` - Move up
- `g` - Jump to top
- `G` - Jump to bottom
- `/` - Search posts (by title, author, or domain)
- `Enter` - View post and comments
- `o` - Open article in browser
- `c` or `Space` - Open HN discussion in browser
- `r` - Refresh feed
- `Esc` - Clear search

#### Post/Comments View
- `j` or `↓` - Move to next comment
- `k` or `↑` - Move to previous comment
- `g` - Jump to first comment
- `G` - Jump to last comment
- `/` - Search comments (by text or author)
- `Space` - Collapse/expand comment thread
- `o` - Open article in browser
- `c` - Open selected comment in browser
- `Esc` or `Backspace` - Return to feed (or clear search if active)

## API Usage

The package also exports a programmatic API for accessing HackerNews data:

```typescript
import { HackerNewsClient, FeedType } from 'hackernews-companion';

const client = new HackerNewsClient();

// Get top 10 posts
const posts = await client.getPosts(FeedType.TOP, 10);

// Get a specific post
const post = await client.getPost(123456);

// Get comments from a post
if (post !== null) {
  const comments = await post.getComments();
  console.log(`Found ${comments.length} top-level comments`);

  // Open post in browser
  await post.openInBrowser();

  // Open article in browser (if it has an external URL)
  if (post.url !== null) {
    await post.openArticleInBrowser();
  }
}

// Search posts
const searchResults = await client.searchPosts(FeedType.TOP, 'typescript', 100);

// Get user information
const user = await client.getUser('username');

// Get posts by user
const userPosts = await client.getPostsByUser('username', 20);
```

## Development

```bash
# Run in development mode with hot reload
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Type checking
bun run type-check

# Linting
bun run lint

# Format code
bun run format

# Build for distribution
bun run build
```

## Project Structure

```
src/
├── hackernews-client.ts    # Main API client
├── hackernews-post.ts      # Post model with comment loading
├── types.ts                # TypeScript type definitions
├── events/                 # Event logging system
└── tui/                    # Terminal UI components
    ├── App.tsx             # Main TUI application
    ├── components/         # React components
    │   ├── FeedView.tsx
    │   ├── PostView.tsx
    │   └── HelpView.tsx
    └── utils.ts            # UI utilities
```

## Technologies

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **TUI Framework**: [Ink](https://github.com/vadimdemedes/ink) (React for CLIs)
- **API**: [HackerNews Official API](https://github.com/HackerNews/API)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
