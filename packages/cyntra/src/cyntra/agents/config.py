"""Configuration settings for the agents package."""

from enum import Enum

from pydantic_settings import SettingsConfigDict

from cyntra.commons import BaseSchema, BaseSettings
from cyntra.commons.config.openai import LLMDeployment, OpenAIConfig


class CheckpointStoreType(str, Enum):
    """Type of checkpoint store for LangGraph."""

    MEMORY = "memory"
    POSTGRES = "postgres"


class CheckpointStoreConfig(BaseSchema):
    """Configuration for LangGraph checkpoint storage."""

    store_type: CheckpointStoreType = CheckpointStoreType.MEMORY
    connection_string: str | None = None


class AgentBehaviorConfig(BaseSchema):
    """Agent-specific behavior tuning."""

    default_block_duration_minutes: int = 25
    max_blocks_per_plan: int = 10
    reflection_prompt_delay_seconds: int = 300  # 5 minutes after block ends
    temperature: float = 0.7
    max_tokens: int = 4096


class AgentFeatureFlags(BaseSchema):
    """Feature flags for optional agent capabilities."""

    enable_cognee: bool = False
    enable_browser_signals: bool = False
    enable_ide_signals: bool = False
    enable_calendar_signals: bool = False


class AgentSettings(BaseSettings):
    """Settings for the Glyph agent system.

    Built by apps/backend from environment variables and passed
    to GlyphAgentService on construction.
    """

    model_config = SettingsConfigDict(
        env_prefix="GLYPH_",
        env_nested_delimiter="__",
    )

    # LLM deployments - use OpenAIConfig for role-based selection
    llm: OpenAIConfig = OpenAIConfig(
        default=LLMDeployment(model="gpt-4o"),
    )

    # LangGraph checkpoint storage
    checkpoint_store: CheckpointStoreConfig = CheckpointStoreConfig()

    # Feature flags
    features: AgentFeatureFlags = AgentFeatureFlags()

    # Behavior tuning
    behavior: AgentBehaviorConfig = AgentBehaviorConfig()


# Convenience accessor for the main Glyph deployment
def get_glyph_deployment(settings: AgentSettings) -> LLMDeployment:
    """Get the LLM deployment for Glyph's main persona."""
    return settings.llm.default


def get_planner_deployment(settings: AgentSettings) -> LLMDeployment:
    """Get the LLM deployment for the Planner mode."""
    return settings.llm.get_deployment("planner")


def get_coach_deployment(settings: AgentSettings) -> LLMDeployment:
    """Get the LLM deployment for the Coach mode."""
    return settings.llm.get_deployment("coach")


# Default settings for development/testing
DEFAULT_SETTINGS = AgentSettings()
