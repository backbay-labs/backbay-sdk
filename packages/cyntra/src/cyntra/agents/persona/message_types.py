"""Message type normalization for the Glyph agent.

Provides a unified interface for messages across different
LLM providers and agent frameworks.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class MessageRole(str, Enum):
    """Role of a message participant."""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass
class ToolCall:
    """A tool call made by the assistant."""

    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class ToolResult:
    """Result of a tool call."""

    tool_call_id: str
    content: str
    is_error: bool = False


@dataclass
class Message:
    """A normalized message in an agent conversation.

    This is the internal representation that gets converted
    to/from provider-specific formats.
    """

    role: MessageRole
    content: str
    name: str | None = None
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_call_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def system(cls, content: str) -> "Message":
        """Create a system message."""
        return cls(role=MessageRole.SYSTEM, content=content)

    @classmethod
    def user(cls, content: str, name: str | None = None) -> "Message":
        """Create a user message."""
        return cls(role=MessageRole.USER, content=content, name=name)

    @classmethod
    def assistant(
        cls,
        content: str,
        tool_calls: list[ToolCall] | None = None,
    ) -> "Message":
        """Create an assistant message."""
        return cls(
            role=MessageRole.ASSISTANT,
            content=content,
            tool_calls=tool_calls or [],
        )

    @classmethod
    def tool(cls, tool_call_id: str, content: str, name: str | None = None) -> "Message":
        """Create a tool result message."""
        return cls(
            role=MessageRole.TOOL,
            content=content,
            tool_call_id=tool_call_id,
            name=name,
        )


def to_openai_format(message: Message) -> dict[str, Any]:
    """Convert internal message to OpenAI API format."""
    result: dict[str, Any] = {
        "role": message.role.value,
        "content": message.content,
    }

    if message.name:
        result["name"] = message.name

    if message.tool_calls:
        result["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.name,
                    "arguments": str(tc.arguments),  # OpenAI expects string
                },
            }
            for tc in message.tool_calls
        ]

    if message.tool_call_id:
        result["tool_call_id"] = message.tool_call_id

    return result


def from_openai_format(data: dict[str, Any]) -> Message:
    """Convert OpenAI API format to internal message."""
    role = MessageRole(data["role"])

    tool_calls: list[ToolCall] = []
    if "tool_calls" in data:
        for tc in data["tool_calls"]:
            tool_calls.append(
                ToolCall(
                    id=tc["id"],
                    name=tc["function"]["name"],
                    arguments=tc["function"].get("arguments", {}),
                )
            )

    return Message(
        role=role,
        content=data.get("content", ""),
        name=data.get("name"),
        tool_calls=tool_calls,
        tool_call_id=data.get("tool_call_id"),
    )


@dataclass
class Conversation:
    """A conversation (list of messages) with helper methods."""

    messages: list[Message] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def add(self, message: Message) -> None:
        """Add a message to the conversation."""
        self.messages.append(message)

    def add_system(self, content: str) -> None:
        """Add a system message."""
        self.add(Message.system(content))

    def add_user(self, content: str, name: str | None = None) -> None:
        """Add a user message."""
        self.add(Message.user(content, name))

    def add_assistant(
        self,
        content: str,
        tool_calls: list[ToolCall] | None = None,
    ) -> None:
        """Add an assistant message."""
        self.add(Message.assistant(content, tool_calls))

    def add_tool_result(
        self,
        tool_call_id: str,
        content: str,
        name: str | None = None,
    ) -> None:
        """Add a tool result message."""
        self.add(Message.tool(tool_call_id, content, name))

    def to_openai_messages(self) -> list[dict[str, Any]]:
        """Convert all messages to OpenAI format."""
        return [to_openai_format(m) for m in self.messages]

    def get_last_assistant_message(self) -> Message | None:
        """Get the most recent assistant message."""
        for msg in reversed(self.messages):
            if msg.role == MessageRole.ASSISTANT:
                return msg
        return None

    def get_last_user_message(self) -> Message | None:
        """Get the most recent user message."""
        for msg in reversed(self.messages):
            if msg.role == MessageRole.USER:
                return msg
        return None

    def truncate_to_tokens(self, max_tokens: int, model: str = "gpt-4") -> "Conversation":
        """Truncate conversation to fit within token limit.

        Simple implementation - keeps system message and recent messages.
        A real implementation would use tiktoken for accurate counting.
        """
        # Very rough estimate: ~4 chars per token
        chars_per_token = 4
        max_chars = max_tokens * chars_per_token

        # Always keep system message
        system_msgs = [m for m in self.messages if m.role == MessageRole.SYSTEM]
        other_msgs = [m for m in self.messages if m.role != MessageRole.SYSTEM]

        total_chars = sum(len(m.content) for m in system_msgs)
        kept_msgs: list[Message] = []

        # Add messages from most recent, until we hit limit
        for msg in reversed(other_msgs):
            msg_chars = len(msg.content)
            if total_chars + msg_chars > max_chars:
                break
            kept_msgs.insert(0, msg)
            total_chars += msg_chars

        return Conversation(
            messages=system_msgs + kept_msgs,
            metadata=self.metadata,
        )
