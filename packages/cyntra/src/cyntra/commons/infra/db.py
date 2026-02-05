"""Database engine and session helpers.

Requires the 'db' extra: pip install segrada-commons[db]
"""

from typing import TYPE_CHECKING, Any

from cyntra.commons.config.db import DatabaseConfig

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker


def create_async_engine_from_config(config: DatabaseConfig) -> "AsyncEngine":
    """Create an async SQLAlchemy engine from config.

    Args:
        config: Database configuration.

    Returns:
        Configured AsyncEngine.

    Raises:
        ImportError: If sqlalchemy is not installed.
    """
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
    except ImportError as e:
        raise ImportError(
            "sqlalchemy is required for database helpers. "
            "Install with: pip install segrada-commons[db]"
        ) from e

    return create_async_engine(
        config.dsn,
        echo=config.echo,
        pool_size=config.pool_size,
        max_overflow=config.max_overflow,
        pool_timeout=config.pool_timeout,
        pool_recycle=config.pool_recycle,
    )


def create_session_factory(
    engine: "AsyncEngine",
    **kwargs: Any,
) -> "async_sessionmaker[AsyncSession]":
    """Create an async session factory from an engine.

    Args:
        engine: The async engine to bind sessions to.
        **kwargs: Additional kwargs passed to async_sessionmaker.

    Returns:
        Configured async_sessionmaker.

    Raises:
        ImportError: If sqlalchemy is not installed.
    """
    try:
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    except ImportError as e:
        raise ImportError(
            "sqlalchemy is required for database helpers. "
            "Install with: pip install segrada-commons[db]"
        ) from e

    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        **kwargs,
    )
