"""Base Pydantic model for all schemas in the monorepo."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base class for all Pydantic models in Segrada.

    Provides:
    - Strict validation with extra fields ignored
    - Support for field aliases
    - Validation on assignment
    - Convenience methods for serialization
    """

    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
        validate_assignment=True,
        str_strip_whitespace=True,
    )

    def to_dict(self, **kwargs: Any) -> dict[str, Any]:
        """Convert model to dictionary.

        Args:
            **kwargs: Passed to model_dump().

        Returns:
            Dictionary representation of the model.
        """
        return self.model_dump(**kwargs)

    def to_json(self, **kwargs: Any) -> str:
        """Convert model to JSON string.

        Args:
            **kwargs: Passed to model_dump_json().

        Returns:
            JSON string representation of the model.
        """
        return self.model_dump_json(**kwargs)
