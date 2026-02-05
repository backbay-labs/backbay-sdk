"""Context variables for correlation across async boundaries.

These context variables allow logs and traces from different layers
(API, business logic, agents) to be correlated using shared IDs.
"""

from contextvars import ContextVar
from typing import Any

from cyntra.commons.core.ids import new_id

# Context variables for request/correlation tracking
correlation_id_var: ContextVar[str | None] = ContextVar("correlation_id", default=None)
user_id_var: ContextVar[str | None] = ContextVar("user_id", default=None)
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


def set_correlation_id(value: str | None) -> None:
    """Set the correlation ID for the current context.

    Args:
        value: The correlation ID to set, or None to clear.
    """
    correlation_id_var.set(value)


def get_correlation_id() -> str | None:
    """Get the correlation ID for the current context.

    Returns:
        The correlation ID, or None if not set.
    """
    return correlation_id_var.get()


def new_correlation_id() -> str:
    """Generate and set a new correlation ID.

    Convenience function that generates a new ID and sets it
    in the current context.

    Returns:
        The newly generated correlation ID.
    """
    cid: str = new_id()
    set_correlation_id(cid)
    return cid


def set_user_id(value: str | None) -> None:
    """Set the user ID for the current context.

    Args:
        value: The user ID to set, or None to clear.
    """
    user_id_var.set(value)


def get_user_id() -> str | None:
    """Get the user ID for the current context.

    Returns:
        The user ID, or None if not set.
    """
    return user_id_var.get()


def set_request_id(value: str | None) -> None:
    """Set the request ID for the current context.

    Args:
        value: The request ID to set, or None to clear.
    """
    request_id_var.set(value)


def get_request_id() -> str | None:
    """Get the request ID for the current context.

    Returns:
        The request ID, or None if not set.
    """
    return request_id_var.get()


def get_context_dict() -> dict[str, Any]:
    """Get all context values as a dictionary.

    Useful for including in log records or span attributes.

    Returns:
        Dictionary with non-None context values.
    """
    ctx: dict[str, Any] = {}
    if (cid := get_correlation_id()) is not None:
        ctx["correlation_id"] = cid
    if (uid := get_user_id()) is not None:
        ctx["user_id"] = uid
    if (rid := get_request_id()) is not None:
        ctx["request_id"] = rid
    return ctx


def clear_context() -> None:
    """Clear all context variables.

    Useful at the end of a request to ensure clean state.
    """
    set_correlation_id(None)
    set_user_id(None)
    set_request_id(None)
