"""Segrada Commons - Shared foundation for Python services.

This package provides cross-cutting utilities used by all Python
apps and packages in the Segrada monorepo:

- Core types and ID generation
- Base Pydantic models and error contracts
- Configuration patterns
- Logging and telemetry
- Time utilities
- Infrastructure helpers (DB, Redis)
- Event schemas

Example:
    from cyntra.commons import (
        BaseSchema,
        BaseSettings,
        ErrorCode,
        ServiceError,
        get_logger,
        new_id,
        now_utc,
    )
"""

__version__ = "0.1.0"

# Core
# Config
from cyntra.commons.config.base import BaseSettings
from cyntra.commons.config.db import DatabaseConfig
from cyntra.commons.config.openai import LLMDeployment, OpenAIConfig
from cyntra.commons.config.telemetry import TelemetryConfig
from cyntra.commons.core.ids import IdStr, is_valid_id, new_id, parse_id
from cyntra.commons.core.types import Environment, SurfaceType

# Events
from cyntra.commons.events.base import EventEnvelope

# Schema
from cyntra.commons.schema.base import BaseSchema
from cyntra.commons.schema.errors import ErrorCode, ErrorPayload, ServiceError

# Telemetry
from cyntra.commons.telemetry.context import (
    clear_context,
    get_context_dict,
    get_correlation_id,
    get_request_id,
    get_user_id,
    new_correlation_id,
    set_correlation_id,
    set_request_id,
    set_user_id,
)
from cyntra.commons.telemetry.logging import configure_logging, get_logger

# Time
from cyntra.commons.time.utils import now_utc, parse_iso8601, to_local, to_utc

__all__ = [
    # Version
    "__version__",
    # Core
    "IdStr",
    "new_id",
    "parse_id",
    "is_valid_id",
    "SurfaceType",
    "Environment",
    # Schema
    "BaseSchema",
    "ErrorCode",
    "ErrorPayload",
    "ServiceError",
    # Config
    "BaseSettings",
    "DatabaseConfig",
    "LLMDeployment",
    "OpenAIConfig",
    "TelemetryConfig",
    # Telemetry
    "configure_logging",
    "get_logger",
    "set_correlation_id",
    "get_correlation_id",
    "new_correlation_id",
    "set_user_id",
    "get_user_id",
    "set_request_id",
    "get_request_id",
    "get_context_dict",
    "clear_context",
    # Time
    "now_utc",
    "to_utc",
    "to_local",
    "parse_iso8601",
    # Events
    "EventEnvelope",
]
