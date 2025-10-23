# HackerNews TUI Design Document

## Design Goals

1. **Speed**: Fast navigation, minimal keystrokes for common actions
2. **Clarity**: Clear visual hierarchy, easy to scan
3. **Efficiency**: Show maximum useful information without clutter
4. **Familiarity**: Follow established TUI patterns (vim, less, etc.)

## View Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  HN: Top Stories (30)                          [R]efresh     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. [342↑] What happened to Apple's attention to detail?     │
│            └─ apple.com · 192 comments · 2h ago              │
│                                                               │
│  2. [227↑] Claude Memory                                     │
│            └─ anthropic.com · 138 comments · 4h ago          │
│                                                               │
│  3. [48↑] Reasoning Is Not Model Improvement                 │
│           └─ arxiv.org · 38 comments · 3h ago                │
│                                                               │
│  ...                                                          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ j/k:navigate  Enter:view  o:open  h:help  q:quit  1-6:feeds │
└─────────────────────────────────────────────────────────────┘
```

## Feed View (Main View)

**Layout**:
- Header: Feed name + count + actions
- Body: Scrollable post list
- Footer: Keyboard shortcuts

**Post List Format**:
```
[rank]. [score↑] Title
        └─ domain · N comments · time ago
```

**Colors**:
- Score: Cyan (highlights popular posts)
- Title: White/Default (primary content)
- Metadata: Gray (secondary info)
- Selected: Inverse/Bold

**Navigation**:
- `j/k` or `↓/↑`: Move selection
- `g/G`: Jump to top/bottom
- `Enter`: View post details
- `o`: Open article URL
- `c`: Open HN comments in browser
- `r`: Refresh feed
- `1-6`: Switch feeds (1=Top, 2=New, 3=Best, 4=Ask, 5=Show, 6=Job)
- `/`: Search posts
- `u`: View user posts
- `h/?`: Help
- `q`: Quit

## Post Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                                                        │
├─────────────────────────────────────────────────────────────┤
│ What happened to Apple's legendary attention to detail?      │
│ 342 points by Bogdanp · 192 comments · 2h ago                │
│ https://apple.com/...                                         │
│                                                               │
│ [o] Open article  [c] Open HN discussion                     │
├─────────────────────────────────────────────────────────────┤
│ Comments (192):                                               │
│                                                               │
│ ▼ cainxinth · 2h ago                                         │
│   I don't use any of these type of LLM tools which...        │
│                                                               │
│   ▼ reply_user · 1h ago                                      │
│     But have you considered...                               │
│                                                               │
│     ▶ nested_reply · 30m ago [collapsed]                     │
│                                                               │
│ ▼ another_user · 1h ago                                      │
│   This is a great point...                                   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ j/k:navigate  Space:collapse  o:open  Esc:back  q:quit      │
└─────────────────────────────────────────────────────────────┘
```

**Comment Display**:
- Tree structure with visual indentation
- Collapsible comment threads
- Author + timestamp
- Selected comment highlighted

**Navigation**:
- `j/k` or `↓/↑`: Move between comments
- `Space`: Collapse/expand thread
- `n/N`: Next/previous sibling comment
- `p`: Jump to parent comment
- `o`: Open article
- `c`: Open HN discussion
- `Esc/Backspace`: Back to feed
- `q`: Quit

## User Posts View

Similar to feed view but filtered by username:
```
┌─────────────────────────────────────────────────────────────┐
│ HN: Posts by @pg (157316 karma)                              │
├─────────────────────────────────────────────────────────────┤
│ ... (same as feed view)                                      │
└─────────────────────────────────────────────────────────────┘
```

## Help View

```
┌─────────────────────────────────────────────────────────────┐
│ HackerNews TUI - Keyboard Shortcuts                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ NAVIGATION                                                    │
│   j/k, ↓/↑     Move up/down                                  │
│   g/G          Jump to top/bottom                            │
│   Enter        View post details                             │
│   Esc/Backspace Back to previous view                        │
│                                                               │
│ ACTIONS                                                       │
│   o            Open article in browser                       │
│   c            Open HN discussion in browser                 │
│   r            Refresh current feed                          │
│   Space        Collapse/expand comment (detail view)         │
│                                                               │
│ FEEDS                                                         │
│   1            Top stories                                   │
│   2            New stories                                   │
│   3            Best stories                                  │
│   4            Ask HN                                        │
│   5            Show HN                                       │
│   6            Jobs                                          │
│                                                               │
│ OTHER                                                         │
│   u            View user posts (enter username)              │
│   /            Search posts                                  │
│   h, ?         Show this help                                │
│   q            Quit                                          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ Press any key to close                                       │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

**Minimal & Readable**:
- Background: Default terminal
- Primary text: White/Default
- Score/Highlights: Cyan
- Metadata: Gray/Dim
- Selected item: Inverse video or Bold
- Links: Blue (underlined)
- Error messages: Red
- Success messages: Green

## State Management

**App State**:
```typescript
{
  view: 'feed' | 'post' | 'help' | 'search' | 'user',
  feed: FeedType,
  posts: HackerNewsPost[],
  selectedIndex: number,
  currentPost: HackerNewsPost | null,
  comments: Comment[],
  selectedCommentIndex: number,
  collapsedComments: Set<number>, // comment IDs
  loading: boolean,
  error: string | null,
  searchQuery: string,
  username: string,
}
```

## Performance Considerations

1. **Lazy Loading**: Load comments only when viewing post
2. **Caching**: Cache fetched posts and comments
3. **Pagination**: Load more posts on demand (scroll to bottom)
4. **Debouncing**: Debounce search input
5. **Virtual Scrolling**: For very long comment threads

## Accessibility

1. Arrow keys as alternative to vim keys
2. Clear visual feedback for selected items
3. Status messages for loading states
4. Error messages with retry options

## Progressive Enhancement

**Phase 1 (MVP)**:
- Feed view with navigation
- Post detail with comments
- Basic keyboard shortcuts
- Open in browser

**Phase 2**:
- Search functionality
- User post view
- Comment collapse/expand
- Refresh with loading states

**Phase 3**:
- Pagination/infinite scroll
- Advanced navigation (jump to comment)
- Bookmarks/favorites
- Offline mode

## Implementation Notes

- Use Ink for React-based TUI
- Component hierarchy: App > Router > (FeedView | PostView | HelpView)
- Custom hooks for keyboard handling
- Context for global state management
