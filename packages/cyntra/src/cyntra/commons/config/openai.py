"""OpenAI / LLM configuration schemas."""

from cyntra.commons.schema.base import BaseSchema


class LLMDeployment(BaseSchema):
    """Configuration for a single LLM deployment/model.

    Supports OpenAI-compatible APIs including Azure OpenAI,
    local models via LiteLLM, etc.
    """

    model: str
    """Model identifier (e.g., 'gpt-4o', 'gpt-4o-mini')."""

    base_url: str | None = None
    """Custom API endpoint. None uses OpenAI default."""

    api_key: str | None = None
    """API key. Prefer loading via env vars in production."""

    temperature: float = 0.4
    """Sampling temperature. Lower = more deterministic."""

    max_tokens: int | None = None
    """Maximum tokens in response. None = model default."""

    timeout: float = 60.0
    """Request timeout in seconds."""


class OpenAIConfig(BaseSchema):
    """Configuration for multiple LLM deployments by role.

    Allows different models for different use cases
    (e.g., cheaper model for simple tasks, better model for planning).

    Example:
        openai_config = OpenAIConfig(
            default=LLMDeployment(model="gpt-4o-mini"),
            planner=LLMDeployment(model="gpt-4o", temperature=0.2),
        )
    """

    default: LLMDeployment
    """Default model used when no specific role is requested."""

    planner: LLMDeployment | None = None
    """Model for planning/reasoning tasks (optional override)."""

    coach: LLMDeployment | None = None
    """Model for coaching/feedback tasks (optional override)."""

    embeddings: LLMDeployment | None = None
    """Model for embeddings (optional, different config shape typically)."""

    def get_deployment(self, role: str | None = None) -> "LLMDeployment":
        """Get the LLM deployment for a specific role.

        Args:
            role: Role name ('planner', 'coach', etc.) or None for default.

        Returns:
            LLMDeployment for the role, falling back to default.
        """
        if role is None:
            return self.default

        deployment: LLMDeployment | None = getattr(self, role, None)
        if deployment is not None:
            return deployment

        return self.default
