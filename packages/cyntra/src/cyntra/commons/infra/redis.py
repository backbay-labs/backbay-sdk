"""Redis client factory.

Requires the 'redis' extra: pip install segrada-commons[redis]
"""

from typing import Any

from cyntra.commons.schema.base import BaseSchema


class RedisConfig(BaseSchema):
    """Configuration for Redis connections."""

    url: str
    """Redis connection URL (e.g., redis://localhost:6379)."""

    db: int = 0
    """Redis database number."""

    password: str | None = None
    """Redis password (if required)."""

    socket_timeout: float = 5.0
    """Socket timeout in seconds."""

    socket_connect_timeout: float = 5.0
    """Connection timeout in seconds."""

    max_connections: int = 10
    """Maximum pool connections."""


def create_redis_pool(config: RedisConfig) -> Any:
    """Create a Redis connection pool from config.

    Args:
        config: Redis configuration.

    Returns:
        Configured Redis client with connection pool.

    Raises:
        ImportError: If redis is not installed.
    """
    try:
        from redis.asyncio import Redis
    except ImportError as e:
        raise ImportError(
            "redis is required for Redis helpers. "
            "Install with: pip install segrada-commons[redis]"
        ) from e

    return Redis.from_url(
        config.url,
        db=config.db,
        password=config.password,
        socket_timeout=config.socket_timeout,
        socket_connect_timeout=config.socket_connect_timeout,
        max_connections=config.max_connections,
        decode_responses=True,
    )
