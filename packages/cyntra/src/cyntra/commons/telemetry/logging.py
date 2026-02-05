"""Logging configuration and helpers.

Provides structured logging with context variable integration
for correlation IDs and request tracking.
"""

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from cyntra.commons.config.telemetry import TelemetryConfig
from cyntra.commons.telemetry.context import get_context_dict


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging.

    Outputs log records as JSON with standard fields plus
    context variables (correlation_id, user_id, request_id).
    """

    def __init__(self, service_name: str | None = None) -> None:
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_dict: dict[str, Any] = {
            "ts": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }

        # Add service name if configured
        if self.service_name:
            log_dict["service"] = self.service_name

        # Add context variables
        log_dict.update(get_context_dict())

        # Add exception info if present
        if record.exc_info:
            log_dict["exception"] = self.formatException(record.exc_info)

        # Add any extra fields from the record
        for key in ("request_id", "user_id", "correlation_id", "extra"):
            if hasattr(record, key) and getattr(record, key) is not None:
                if key not in log_dict:
                    log_dict[key] = getattr(record, key)

        return json.dumps(log_dict, default=str)


class HumanReadableFormatter(logging.Formatter):
    """Human-readable formatter for development.

    Outputs logs in a readable format with context info appended.
    """

    def __init__(self, service_name: str | None = None) -> None:
        fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        super().__init__(fmt=fmt, datefmt="%Y-%m-%d %H:%M:%S")
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)

        # Append context if available
        ctx = get_context_dict()
        if ctx:
            ctx_str = " | ".join(f"{k}={v}" for k, v in ctx.items())
            base = f"{base} | {ctx_str}"

        return base


_configured = False


def configure_logging(config: TelemetryConfig) -> None:
    """Configure the root logger with the given telemetry config.

    Should be called once at application startup.

    Args:
        config: Telemetry configuration specifying level, format, etc.
    """
    global _configured
    if _configured:
        return

    root_logger = logging.getLogger()
    root_logger.setLevel(config.log_level.upper())

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create stdout handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(config.log_level.upper())

    # Choose formatter based on config
    if config.structured_logging:
        formatter: logging.Formatter = StructuredFormatter(
            service_name=config.service_name
        )
    else:
        formatter = HumanReadableFormatter(service_name=config.service_name)

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    _configured = True


def get_logger(name: str | None = None) -> logging.Logger:
    """Get a logger instance.

    This is a thin wrapper around logging.getLogger that ensures
    the logger uses our configured format. Call configure_logging()
    at app startup before using this.

    Args:
        name: Logger name (usually __name__). None for root logger.

    Returns:
        A configured Logger instance.
    """
    return logging.getLogger(name)


def reset_logging_config() -> None:
    """Reset logging configuration state.

    Primarily useful for testing to allow reconfiguration.
    """
    global _configured
    _configured = False
