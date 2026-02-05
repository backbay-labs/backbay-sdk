"""Background task helpers."""

import asyncio
import logging
from collections.abc import Awaitable
from typing import Any

logger = logging.getLogger(__name__)


def fire_and_forget(coro: Awaitable[Any]) -> asyncio.Task[Any]:
    """Schedule an async task to run in the background.

    The task will run independently and not block the caller.
    Exceptions are logged but do not propagate.

    Args:
        coro: The coroutine to run in the background.

    Returns:
        The created Task object (can be ignored or used for cancellation).

    Example:
        async def send_email(to: str, body: str) -> None:
            ...

        # Fire and forget - don't await
        fire_and_forget(send_email("user@example.com", "Hello!"))
    """

    async def _wrapper() -> Any:
        try:
            return await coro
        except Exception:
            logger.exception("Background task failed")
            return None

    return asyncio.create_task(_wrapper())
