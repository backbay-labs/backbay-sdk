import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UiThemeProvider } from "../../../theme";
import { ChatBubble } from "./ChatBubble";
import { MessageThread } from "./MessageThread";
import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "./types";

// ============================================================================
// META
// ============================================================================

const meta: Meta = {
  title: "Organisms/ChatThread",
};
export default meta;

// ============================================================================
// WRAPPER
// ============================================================================

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <UiThemeProvider>
    <div
      style={{
        background: "#02040a",
        padding: 20,
        height: 600,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  </UiThemeProvider>
);

// ============================================================================
// DATA
// ============================================================================

const assistantMessage: ChatMessage = {
  id: "1",
  role: "assistant",
  senderName: "Assistant",
  content: [
    {
      type: "text",
      text: "Hello! I can help you with your code. What would you like to work on today?",
    },
  ],
  timestamp: new Date(Date.now() - 120_000).toISOString(),
};

const userMessage: ChatMessage = {
  id: "2",
  role: "user",
  content: [
    {
      type: "text",
      text: "Can you help me write a sort function in TypeScript?",
    },
  ],
  timestamp: new Date(Date.now() - 60_000).toISOString(),
};

const systemMessage: ChatMessage = {
  id: "sys-1",
  role: "system",
  content: [{ type: "text", text: "Session started" }],
};

const codeMessage: ChatMessage = {
  id: "3",
  role: "assistant",
  senderName: "Assistant",
  content: [
    {
      type: "text",
      text: "Here is a generic quicksort implementation in TypeScript:",
    },
    {
      type: "code",
      code: {
        language: "typescript",
        title: "quicksort.ts",
        code: `function quicksort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => compare(x, pivot) < 0);
  const middle = arr.filter((x) => compare(x, pivot) === 0);
  const right = arr.filter((x) => compare(x, pivot) > 0);

  return [
    ...quicksort(left, compare),
    ...middle,
    ...quicksort(right, compare),
  ];
}`,
      },
    },
    {
      type: "text",
      text: "This is a functional approach using filter. For large arrays, consider an in-place variant for better memory usage.",
    },
  ],
  timestamp: new Date(Date.now() - 30_000).toISOString(),
};

const toolCallMessage: ChatMessage = {
  id: "4",
  role: "assistant",
  senderName: "Assistant",
  content: [
    {
      type: "text",
      text: "Let me search for relevant test patterns and generate some tests for you.",
    },
    {
      type: "tool_call",
      toolCall: {
        id: "tc-1",
        name: "searchCodebase",
        args: { query: "sort function tests", fileType: "*.test.ts" },
        status: "complete",
        duration: 430,
        result: { matches: 3, files: ["sort.test.ts", "utils.test.ts", "array.test.ts"] },
      },
    },
    {
      type: "tool_call",
      toolCall: {
        id: "tc-2",
        name: "generateTests",
        args: { functionName: "quicksort", framework: "vitest" },
        status: "running",
      },
    },
    {
      type: "tool_call",
      toolCall: {
        id: "tc-3",
        name: "lintCheck",
        status: "pending",
      },
    },
  ],
  timestamp: new Date(Date.now() - 10_000).toISOString(),
};

const streamingMessage: ChatMessage = {
  id: "stream-1",
  role: "assistant",
  senderName: "Assistant",
  isStreaming: true,
  content: [
    {
      type: "text",
      text: "I am analyzing your codebase to find the most appropriate location for the sort function. Let me check the existing utility files and determine the best approach for integration.",
    },
  ],
};

const fullConversation: ChatMessage[] = [
  systemMessage,
  userMessage,
  {
    ...assistantMessage,
    id: "conv-2",
    content: [
      {
        type: "text",
        text: "Of course! I would be happy to help you write a sort function. Here is a clean TypeScript implementation:",
      },
      {
        type: "code",
        code: {
          language: "typescript",
          title: "quicksort.ts",
          code: `export function quicksort<T>(
  arr: T[],
  compare: (a: T, b: T) => number = (a, b) =>
    a < b ? -1 : a > b ? 1 : 0
): T[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => compare(x, pivot) < 0);
  const mid = arr.filter((x) => compare(x, pivot) === 0);
  const right = arr.filter((x) => compare(x, pivot) > 0);

  return [...quicksort(left, compare), ...mid, ...quicksort(right, compare)];
}`,
        },
      },
    ],
  },
  {
    id: "conv-3",
    role: "user",
    content: [
      { type: "text", text: "Can you also add tests?" },
    ],
    timestamp: new Date(Date.now() - 20_000).toISOString(),
  },
  {
    id: "conv-4",
    role: "assistant",
    senderName: "Assistant",
    content: [
      {
        type: "text",
        text: "Sure! Let me find existing test patterns in your project first.",
      },
      {
        type: "tool_call",
        toolCall: {
          id: "tc-conv-1",
          name: "searchCodebase",
          args: { query: "test patterns", fileType: "*.test.ts" },
          status: "complete",
          duration: 280,
          result: { found: 5 },
        },
      },
      {
        type: "code",
        code: {
          language: "typescript",
          title: "quicksort.test.ts",
          code: `import { describe, it, expect } from 'vitest';
import { quicksort } from './quicksort';

describe('quicksort', () => {
  it('sorts numbers ascending', () => {
    expect(quicksort([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
  });

  it('handles empty arrays', () => {
    expect(quicksort([])).toEqual([]);
  });

  it('handles single-element arrays', () => {
    expect(quicksort([42])).toEqual([42]);
  });

  it('supports custom comparators', () => {
    const desc = (a: number, b: number) => b - a;
    expect(quicksort([3, 1, 4], desc)).toEqual([4, 3, 1]);
  });
});`,
        },
      },
    ],
    timestamp: new Date(Date.now() - 5_000).toISOString(),
  },
];

// ============================================================================
// STORIES
// ============================================================================

export const SingleBubble: StoryObj = {
  render: () => (
    <Wrapper>
      <ChatBubble message={assistantMessage} showTimestamp />
    </Wrapper>
  ),
};

export const UserMessage: StoryObj = {
  render: () => (
    <Wrapper>
      <ChatBubble message={userMessage} showTimestamp />
    </Wrapper>
  ),
};

export const SystemMessageStory: StoryObj = {
  name: "SystemMessage",
  render: () => (
    <Wrapper>
      <ChatBubble message={systemMessage} />
    </Wrapper>
  ),
};

export const WithCodeBlock: StoryObj = {
  render: () => (
    <Wrapper>
      <ChatBubble message={codeMessage} showTimestamp />
    </Wrapper>
  ),
};

export const WithToolCall: StoryObj = {
  render: () => (
    <Wrapper>
      <ChatBubble message={toolCallMessage} showTimestamp />
    </Wrapper>
  ),
};

export const StreamingMessage: StoryObj = {
  render: () => (
    <Wrapper>
      <ChatBubble message={streamingMessage} />
    </Wrapper>
  ),
};

export const FullConversation: StoryObj = {
  render: () => (
    <Wrapper>
      <MessageThread messages={fullConversation} showTimestamps />
    </Wrapper>
  ),
};

function ChatUIDemo() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(fullConversation);

  const handleSubmit = React.useCallback((text: string) => {
    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: [{ type: "text", text }],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  return (
    <Wrapper>
      <MessageThread
        messages={messages}
        style={{ flex: 1, minHeight: 0 }}
      />
      <div style={{ paddingTop: 12 }}>
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </Wrapper>
  );
}

export const WithChatInput: StoryObj = {
  render: () => <ChatUIDemo />,
};

export const LoadingMore: StoryObj = {
  render: () => (
    <Wrapper>
      <MessageThread
        messages={fullConversation.slice(0, 3)}
        isLoadingMore
      />
    </Wrapper>
  ),
};
