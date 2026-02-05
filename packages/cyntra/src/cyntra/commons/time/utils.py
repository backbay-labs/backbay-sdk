"""Time and date utilities.

Provides consistent UTC handling and timezone conversions
across all services.
"""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    """Get the current time in UTC.

    Returns:
        Timezone-aware datetime in UTC.
    """
    return datetime.now(UTC)


def to_utc(dt: datetime, tz: str | None = None) -> datetime:
    """Convert a datetime to UTC.

    Args:
        dt: The datetime to convert. If naive, assumed to be in `tz`.
        tz: IANA timezone string (e.g., "America/New_York").
            Required if dt is naive.

    Returns:
        Timezone-aware datetime in UTC.

    Raises:
        ValueError: If dt is naive and tz is not provided.
    """
    if dt.tzinfo is None:
        if tz is None:
            raise ValueError("Timezone required for naive datetime")
        dt = dt.replace(tzinfo=ZoneInfo(tz))

    return dt.astimezone(UTC)


def to_local(dt: datetime, tz: str) -> datetime:
    """Convert a datetime to a local timezone.

    Args:
        dt: The datetime to convert. If naive, assumed UTC.
        tz: Target IANA timezone string (e.g., "America/New_York").

    Returns:
        Timezone-aware datetime in the target timezone.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    return dt.astimezone(ZoneInfo(tz))


def start_of_day(dt: datetime, tz: str) -> datetime:
    """Get the start of day for a datetime in a given timezone.

    Args:
        dt: The datetime. If naive, assumed UTC.
        tz: IANA timezone string for the day boundary.

    Returns:
        Datetime at 00:00:00 in the target timezone, expressed in UTC.
    """
    local_dt = to_local(dt, tz)
    start = local_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.astimezone(UTC)


def start_of_week(dt: datetime, tz: str, week_start: int = 0) -> datetime:
    """Get the start of week for a datetime in a given timezone.

    Args:
        dt: The datetime. If naive, assumed UTC.
        tz: IANA timezone string for the week boundary.
        week_start: Day of week to start (0=Monday, 6=Sunday).

    Returns:
        Datetime at 00:00:00 of the week start day, expressed in UTC.
    """
    local_dt = to_local(dt, tz)
    days_since_start = (local_dt.weekday() - week_start) % 7
    week_start_dt = local_dt - timedelta(days=days_since_start)
    week_start_dt = week_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return week_start_dt.astimezone(UTC)


def parse_iso8601(value: str) -> datetime:
    """Parse an ISO 8601 formatted datetime string.

    Handles both timezone-aware and naive formats.
    Naive times are returned as-is (caller should interpret as UTC).

    Args:
        value: ISO 8601 datetime string.

    Returns:
        Parsed datetime.

    Raises:
        ValueError: If the string cannot be parsed.
    """
    # Handle 'Z' suffix (common in JSON)
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    return datetime.fromisoformat(value)


def format_iso8601(dt: datetime) -> str:
    """Format a datetime as ISO 8601 string.

    Args:
        dt: The datetime to format.

    Returns:
        ISO 8601 formatted string with 'Z' suffix for UTC.
    """
    if dt.tzinfo is not None and dt.utcoffset() == timedelta(0):
        # UTC - use Z suffix
        return dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
    return dt.isoformat()


def day_range_for(dt: datetime, tz: str) -> tuple[datetime, datetime]:
    """Get the UTC time range for a day in a given timezone.

    Args:
        dt: A datetime within the target day.
        tz: IANA timezone string.

    Returns:
        Tuple of (start_of_day_utc, end_of_day_utc).
        End is exclusive (start of next day).
    """
    start = start_of_day(dt, tz)
    end = start + timedelta(days=1)
    return (start, end)
