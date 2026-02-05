"""Base configuration pattern using pydantic-settings."""

from typing import Any, Self

from pydantic_settings import BaseSettings as PydanticBaseSettings
from pydantic_settings import SettingsConfigDict


class BaseSettings(PydanticBaseSettings):
    """Base class for all configuration classes in Segrada.

    Provides:
    - Environment variable loading
    - .env file support
    - Type-safe configuration
    - Nested model support

    Example:
        class AppSettings(BaseSettings):
            model_config = SettingsConfigDict(env_prefix="APP_")

            debug: bool = False
            api_key: str
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @classmethod
    def from_env(cls, **overrides: Any) -> Self:
        """Create settings instance with optional overrides.

        Useful for testing where you want default env loading
        but need to override specific values.

        Args:
            **overrides: Field values to override.

        Returns:
            Settings instance with overrides applied.
        """
        return cls(**overrides)
