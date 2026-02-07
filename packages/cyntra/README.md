# cyntra

> Agent orchestration framework with commons utilities for the Backbay platform.

`cyntra` is a Python package providing two main subsystems:

- **`cyntra.commons`** -- Shared foundation: ID generation, base schemas, config, logging, telemetry, time utils, event envelopes, and infrastructure helpers (DB, Redis).
- **`cyntra.agents`** -- AI agent framework: persona-driven agents, LangGraph workflows, DSPy modules, tool definitions, memory abstractions, and evaluation harnesses.

## Installation

```bash
# Using uv (recommended)
uv add cyntra

# With optional extras
uv add cyntra[db,redis,otel,http,orjson]

# Everything
uv add cyntra[all]
```

Requires Python >= 3.13.

## Quick Start

### Commons

```python
from cyntra.commons import (
    BaseSchema,
    BaseSettings,
    ServiceError,
    ErrorCode,
    get_logger,
    new_id,
    now_utc,
)

logger = get_logger(__name__)
request_id = new_id()
logger.info("Processing request", extra={"request_id": request_id})
```

### Agents

```python
from cyntra.agents import (
    GlyphAgentService,
    AgentSettings,
    create_in_memory_repos,
    ChatRequest,
)

# Set up agent with in-memory storage
repos = create_in_memory_repos()
settings = AgentSettings()
service = GlyphAgentService(settings=settings, repos=repos)

# Chat with the agent
response = await service.chat(ChatRequest(
    user_id="user-123",
    content="Plan my morning routine",
))
```

## API Overview

### `cyntra.commons`

| Export | Kind | Description |
|--------|------|-------------|
| `new_id()` / `parse_id()` | function | ID generation and parsing |
| `BaseSchema` | class | Base Pydantic model for all schemas |
| `BaseSettings` | class | Base Pydantic settings for config |
| `ServiceError` / `ErrorCode` | class/enum | Structured error handling |
| `get_logger()` / `configure_logging()` | function | Structured logging with correlation IDs |
| `set_correlation_id()` / `get_correlation_id()` | function | Request-scoped context |
| `now_utc()` / `parse_iso8601()` | function | Time utilities |
| `EventEnvelope` | class | Base event schema |
| `DatabaseConfig` / `OpenAIConfig` / `TelemetryConfig` | class | Service configuration models |

### `cyntra.agents`

| Export | Kind | Description |
|--------|------|-------------|
| `GlyphAgentService` | class | Main agent service (chat, plan, reflect) |
| `KernelOrchestratorService` | class | Multi-agent orchestration |
| `GraphRouter` | class | LangGraph workflow router |
| `GlyphEntrypoint` / `GlyphMode` | enum | Agent entry modes |
| `AgentSettings` | class | Agent configuration |
| `create_in_memory_repos()` | function | Create in-memory repository bundle |
| `ChatRequest` / `ChatResponse` | class | Chat API models |
| `Mission` / `Block` / `Episode` | class | Core domain models |
| `UserProfile` | class | User profile model |

### Optional Extras

| Extra | Adds |
|-------|------|
| `db` | SQLAlchemy >= 2.0 |
| `redis` | Redis >= 5.0 |
| `otel` | OpenTelemetry API + SDK |
| `http` | httpx >= 0.27 |
| `orjson` | orjson >= 3.10 |
| `all` | All of the above |
| `dev` | ruff, mypy, pytest, pytest-cov, pytest-asyncio |

## Development

```bash
cd packages/cyntra

# Sync with dev extras
uv sync --extra dev

# Run tests
uv run pytest

# Type check
uv run mypy src/

# Lint
uv run ruff check src/
```

## License

MIT
