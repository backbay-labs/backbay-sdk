"""Persona layer for Glyph - prompts, messages, and agent factory."""

from .agent_factory import (
    AgentConfig,
    GlyphPersona,
    ToolDefinition,
    ToolRegistry,
    create_glyph_agent_config,
    create_glyph_persona,
    create_tool_registry_from_tools,
)
from .kernel_orchestrator import (
    KernelOrchestratorPersona,
    create_kernel_orchestrator_config,
    create_kernel_orchestrator_persona,
    create_kernel_tool_registry,
)
from .kernel_prompts import (
    KERNEL_ORCHESTRATOR_SYSTEM_PROMPT,
    build_kernel_system_prompt,
)
from .message_types import (
    Conversation,
    Message,
    MessageRole,
    ToolCall,
    ToolResult,
    from_openai_format,
    to_openai_format,
)
from .prompts import (
    ARCHIVIST_EXAMPLES,
    COACH_EXAMPLES,
    GLYPH_SYSTEM_PROMPT,
    PLANNER_EXAMPLES,
    build_system_prompt,
    get_mode_examples,
)

__all__ = [
    # Agent factory
    "AgentConfig",
    "GlyphPersona",
    "ToolDefinition",
    "ToolRegistry",
    "create_glyph_agent_config",
    "create_glyph_persona",
    "create_tool_registry_from_tools",
    "KernelOrchestratorPersona",
    "create_kernel_orchestrator_config",
    "create_kernel_orchestrator_persona",
    "create_kernel_tool_registry",
    # Message types
    "Conversation",
    "Message",
    "MessageRole",
    "ToolCall",
    "ToolResult",
    "from_openai_format",
    "to_openai_format",
    # Prompts
    "ARCHIVIST_EXAMPLES",
    "COACH_EXAMPLES",
    "GLYPH_SYSTEM_PROMPT",
    "KERNEL_ORCHESTRATOR_SYSTEM_PROMPT",
    "PLANNER_EXAMPLES",
    "build_system_prompt",
    "build_kernel_system_prompt",
    "get_mode_examples",
]
