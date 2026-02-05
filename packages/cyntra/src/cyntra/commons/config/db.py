"""Database configuration schema."""

from cyntra.commons.schema.base import BaseSchema


class DatabaseConfig(BaseSchema):
    """Configuration for database connections.

    Can be embedded in app settings or used standalone.
    Works with the infra/db.py helpers to create engines.

    Example:
        class AppSettings(BaseSettings):
            db: DatabaseConfig

        # In .env:
        # DB__DSN=postgresql+asyncpg://user:pass@localhost/mydb
    """

    dsn: str
    """Full database connection URL (e.g., postgresql+asyncpg://...)"""

    echo: bool = False
    """Whether to log all SQL statements (useful for debugging)."""

    pool_size: int = 5
    """Number of connections to keep in the pool."""

    max_overflow: int = 10
    """Max connections above pool_size allowed during spikes."""

    pool_timeout: int = 30
    """Seconds to wait for a connection before timing out."""

    pool_recycle: int = 3600
    """Seconds after which to recycle connections (avoid stale connections)."""
