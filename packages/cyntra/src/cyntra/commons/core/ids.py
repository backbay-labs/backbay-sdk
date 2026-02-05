"""ID generation and validation helpers.

Uses UUID7 for time-ordered, globally unique identifiers.
"""

import uuid
from typing import NewType

# Type alias for ID strings - useful for type hints across the codebase
IdStr = NewType("IdStr", str)


def new_id() -> str:
    """Generate a new globally unique ID.

    Uses UUID4 which provides:
    - Globally unique without coordination
    - 128-bit entropy

    Returns:
        A lowercase hex UUID4 string.
    """
    return str(uuid.uuid4())


def parse_id(value: str) -> str:
    """Validate and normalize an ID string.

    Args:
        value: The ID string to validate.

    Returns:
        The normalized (lowercase) ID string.

    Raises:
        ValueError: If the ID is not a valid UUID format.
    """
    try:
        # Attempt to parse as UUID to validate format
        parsed = uuid.UUID(value)
        return str(parsed)
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid ID format: {value}") from e


def is_valid_id(value: str) -> bool:
    """Check if a string is a valid ID format.

    Args:
        value: The string to check.

    Returns:
        True if valid UUID format, False otherwise.
    """
    try:
        parse_id(value)
        return True
    except ValueError:
        return False
