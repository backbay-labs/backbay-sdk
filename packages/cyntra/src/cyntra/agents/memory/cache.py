"""Caching layer for frequently accessed data.

Simple in-memory cache for MVP. Can be extended to Redis.
"""

from datetime import datetime, timedelta
from typing import Any


class CacheEntry[T]:
    """A single cache entry with TTL."""

    def __init__(self, value: T, ttl_seconds: int) -> None:
        self.value = value
        self.expires_at = datetime.now() + timedelta(seconds=ttl_seconds)

    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class SimpleCache[T]:
    """Simple in-memory cache with TTL support."""

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self._cache: dict[str, CacheEntry[T]] = {}
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> T | None:
        """Get a value from cache, returning None if not found or expired."""
        entry = self._cache.get(key)
        if entry is None:
            return None
        if entry.is_expired():
            del self._cache[key]
            return None
        return entry.value

    def set(self, key: str, value: T, ttl_seconds: int | None = None) -> None:
        """Set a value in cache with optional custom TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._cache[key] = CacheEntry(value, ttl)

    def delete(self, key: str) -> bool:
        """Delete a key from cache. Returns True if key existed."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clear all entries from cache."""
        self._cache.clear()

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        now = datetime.now()
        expired_keys = [k for k, v in self._cache.items() if v.expires_at < now]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)


# Pre-configured caches for common use cases
class ProfileCache(SimpleCache[Any]):
    """Cache for user profiles (longer TTL)."""

    def __init__(self) -> None:
        super().__init__(default_ttl_seconds=600)  # 10 minutes


class MissionCache(SimpleCache[Any]):
    """Cache for missions."""

    def __init__(self) -> None:
        super().__init__(default_ttl_seconds=300)  # 5 minutes


class BlockCache(SimpleCache[Any]):
    """Cache for blocks (shorter TTL as they change frequently)."""

    def __init__(self) -> None:
        super().__init__(default_ttl_seconds=60)  # 1 minute
