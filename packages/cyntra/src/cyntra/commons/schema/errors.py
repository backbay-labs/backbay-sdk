"""Error types and contracts for consistent error handling across services."""

from enum import Enum
from typing import Any

from cyntra.commons.schema.base import BaseSchema


class ErrorCode(str, Enum):
    """Standard error codes used across all services.

    Maps to appropriate HTTP status codes at the API layer.
    """

    # Client errors (4xx)
    VALIDATION_ERROR = "validation_error"  # 400
    UNAUTHENTICATED = "unauthenticated"  # 401
    PERMISSION_DENIED = "permission_denied"  # 403
    NOT_FOUND = "not_found"  # 404
    CONFLICT = "conflict"  # 409
    RATE_LIMITED = "rate_limited"  # 429

    # Server errors (5xx)
    INTERNAL_ERROR = "internal_error"  # 500
    DEPENDENCY_FAILURE = "dependency_failure"  # 502/503


class ErrorPayload(BaseSchema):
    """Standard error response payload for API responses.

    Use this model for all error responses to ensure consistent
    error shapes across services.
    """

    code: ErrorCode
    message: str
    details: dict[str, Any] | None = None
    request_id: str | None = None


class ServiceError(Exception):
    """Internal exception for service-level errors.

    Raise this exception in business logic to signal errors
    with proper codes. The API layer should catch and convert
    to ErrorPayload for the response.

    Example:
        raise ServiceError(
            code=ErrorCode.NOT_FOUND,
            message="Mission not found",
            details={"mission_id": "abc123"}
        )
    """

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details

    def to_payload(self, request_id: str | None = None) -> ErrorPayload:
        """Convert exception to API error payload.

        Args:
            request_id: Optional request ID for tracing.

        Returns:
            ErrorPayload suitable for API response.
        """
        return ErrorPayload(
            code=self.code,
            message=self.message,
            details=self.details,
            request_id=request_id,
        )

    def __repr__(self) -> str:
        return f"ServiceError(code={self.code.value!r}, message={self.message!r})"
