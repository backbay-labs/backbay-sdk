"""Memory layer - repositories and semantic memory for the agents package."""

from .in_memory import (
    InMemoryBlocksRepository,
    InMemoryEpisodesRepository,
    InMemoryGraphRepository,
    InMemoryMissionsRepository,
    InMemorySemanticMemory,
    InMemoryUserProfileRepository,
    create_in_memory_repos,
)
from .interfaces import (
    BlocksRepository,
    EpisodesRepository,
    GraphRepository,
    MissionsRepository,
    RepositoryBundle,
    SemanticMemory,
    UserProfileRepository,
)

__all__ = [
    # Interfaces
    "BlocksRepository",
    "EpisodesRepository",
    "GraphRepository",
    "MissionsRepository",
    "RepositoryBundle",
    "SemanticMemory",
    "UserProfileRepository",
    # In-memory implementations
    "InMemoryBlocksRepository",
    "InMemoryEpisodesRepository",
    "InMemoryGraphRepository",
    "InMemoryMissionsRepository",
    "InMemorySemanticMemory",
    "InMemoryUserProfileRepository",
    "create_in_memory_repos",
]

