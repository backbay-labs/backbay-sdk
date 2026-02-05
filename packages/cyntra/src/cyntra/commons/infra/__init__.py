"""Infrastructure helpers (DB, Redis, background tasks).

Note: DB and Redis helpers require optional dependencies.
Install with: pip install segrada-commons[db] or segrada-commons[redis]
"""

from cyntra.commons.infra.tasks import fire_and_forget

# DB and Redis helpers are imported lazily due to optional deps
__all__ = [
    "fire_and_forget",
    # Available with [db] extra:
    # "create_async_engine_from_config",
    # "create_session_factory",
    # Available with [redis] extra:
    # "RedisConfig",
    # "create_redis_pool",
]


def __getattr__(name: str) -> object:
    """Lazy import for optional dependency modules."""
    if name in ("create_async_engine_from_config", "create_session_factory"):
        from cyntra.commons.infra.db import (
            create_async_engine_from_config,
            create_session_factory,
        )

        mapping = {
            "create_async_engine_from_config": create_async_engine_from_config,
            "create_session_factory": create_session_factory,
        }
        return mapping[name]

    if name in ("RedisConfig", "create_redis_pool"):
        from cyntra.commons.infra.redis import RedisConfig, create_redis_pool

        mapping = {"RedisConfig": RedisConfig, "create_redis_pool": create_redis_pool}
        return mapping[name]

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
