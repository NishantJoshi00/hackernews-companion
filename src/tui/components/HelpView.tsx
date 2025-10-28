/**
 * Help View Component
 */

import React from 'react';
import { Box, Text } from 'ink';

export function HelpView(): React.JSX.Element {
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" padding={1}>
        <Text bold color="cyan">
          HackerNews TUI - Keyboard Shortcuts
        </Text>
        <Text> </Text>

        <Text bold>NAVIGATION</Text>
        <Text>  j/k, ↓/↑       Move up/down</Text>
        <Text>  g/G            Jump to top/bottom</Text>
        <Text>  Enter          View post details</Text>
        <Text>  Esc/Backspace  Back to previous view</Text>
        <Text> </Text>

        <Text bold>ACTIONS</Text>
        <Text>  o              Open article in browser</Text>
        <Text>  c, Space       Open HN discussion in browser (feed view)</Text>
        <Text>  Space          Collapse/expand comment (post view)</Text>
        <Text>  r              Refresh current feed</Text>
        <Text>  /              Search posts (title, author, domain)</Text>
        <Text>  j/k/arrows     Exit search input, navigate filtered results</Text>
        <Text>  Esc            Clear filter and exit search</Text>
        <Text> </Text>

        <Text bold>FEEDS</Text>
        <Text>  1              Top stories</Text>
        <Text>  2              New stories</Text>
        <Text>  3              Best stories</Text>
        <Text>  4              Ask HN</Text>
        <Text>  5              Show HN</Text>
        <Text>  6              Jobs</Text>
        <Text> </Text>

        <Text bold>OTHER</Text>
        <Text>  h, ?           Show this help</Text>
        <Text>  q              Quit</Text>
        <Text> </Text>

        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text dimColor>Press Esc or h to close</Text>
        </Box>
      </Box>
    </Box>
  );
}
