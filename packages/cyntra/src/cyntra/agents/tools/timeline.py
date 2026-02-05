"""Timeline/block management tools for the Glyph agent."""

from datetime import date, datetime, timedelta

from cyntra.commons import new_id, now_utc

from cyntra.agents.memory.interfaces import BlocksRepository, MissionsRepository
from cyntra.agents.schemas import Block, BlockStatus


class TimelineTools:
    """Tools for managing blocks and the user's timeline.

    Blocks are the atomic units of focused work within missions.
    """

    def __init__(
        self,
        blocks_repo: BlocksRepository,
        missions_repo: MissionsRepository,
    ) -> None:
        self._blocks = blocks_repo
        self._missions = missions_repo

    async def propose_blocks_for_mission(
        self,
        mission_id: str,
        *,
        start_date: date | None = None,
        num_blocks: int = 5,
        default_duration_minutes: int = 25,
    ) -> list[Block]:
        """Propose a set of blocks for a mission.

        Returns unsaved Block objects that can be reviewed and committed.
        """
        mission = await self._missions.get(mission_id)
        if not mission:
            return []

        start = start_date or date.today()
        blocks: list[Block] = []

        # Use mission preferences for duration if available
        duration = default_duration_minutes
        if mission.preferences.preferred_block_lengths:
            duration = mission.preferences.preferred_block_lengths[0]

        for i in range(num_blocks):
            # Simple scheduling: one block per day starting from start_date
            block_date = start + timedelta(days=i)

            # Skip days off if configured
            if mission.constraints.days_off:
                weekday = block_date.weekday()
                if weekday in mission.constraints.days_off:
                    continue

            block = Block(
                id=new_id(),
                user_id=mission.user_id,
                mission_id=mission_id,
                sequence_index=len(blocks),
                scheduled_start=datetime.combine(
                    block_date, datetime.min.time().replace(hour=9)
                ),
                planned_duration_minutes=duration,
                status=BlockStatus.PLANNED,
                title=f"{mission.title} - Session {len(blocks) + 1}",
            )
            blocks.append(block)

        return blocks

    async def commit_blocks(self, blocks: list[Block]) -> list[Block]:
        """Save proposed blocks to the repository."""
        saved: list[Block] = []
        for block in blocks:
            saved_block = await self._blocks.create(block)
            saved.append(saved_block)
        return saved

    async def create_block(
        self,
        user_id: str,
        mission_id: str,
        *,
        title: str | None = None,
        plan_note: str | None = None,
        scheduled_start: datetime | None = None,
        planned_duration_minutes: int = 25,
    ) -> Block:
        """Create a single block."""
        # Get sequence index
        existing_blocks = await self._blocks.list_for_mission(mission_id)
        sequence_index = len(existing_blocks)

        block = Block(
            id=new_id(),
            user_id=user_id,
            mission_id=mission_id,
            sequence_index=sequence_index,
            scheduled_start=scheduled_start,
            planned_duration_minutes=planned_duration_minutes,
            status=BlockStatus.PLANNED,
            title=title,
            plan_note=plan_note,
        )

        return await self._blocks.create(block)

    async def start_block(self, block_id: str) -> Block | None:
        """Mark a block as in progress."""
        block = await self._blocks.get(block_id)
        if not block:
            return None

        updated = block.model_copy(
            update={
                "status": BlockStatus.IN_PROGRESS,
                "actual_start": now_utc(),
            }
        )
        return await self._blocks.update(updated)

    async def complete_block(
        self,
        block_id: str,
        *,
        outcome_note: str | None = None,
        completion_ratio: float | None = None,
    ) -> Block | None:
        """Mark a block as completed."""
        block = await self._blocks.get(block_id)
        if not block:
            return None

        updated = block.model_copy(
            update={
                "status": BlockStatus.COMPLETED,
                "actual_end": now_utc(),
                "outcome_note": outcome_note,
                "completion_ratio": completion_ratio,
            }
        )
        return await self._blocks.update(updated)

    async def cancel_block(self, block_id: str) -> Block | None:
        """Cancel a block."""
        block = await self._blocks.get(block_id)
        if not block:
            return None

        updated = block.model_copy(update={"status": BlockStatus.CANCELLED})
        return await self._blocks.update(updated)

    async def skip_block(self, block_id: str) -> Block | None:
        """Skip a block."""
        block = await self._blocks.get(block_id)
        if not block:
            return None

        updated = block.model_copy(update={"status": BlockStatus.SKIPPED})
        return await self._blocks.update(updated)

    async def get_block(self, block_id: str) -> Block | None:
        """Get a block by ID."""
        return await self._blocks.get(block_id)

    async def get_today_blocks(self, user_id: str) -> list[Block]:
        """Get blocks scheduled for today."""
        return await self._blocks.list_for_user_date(user_id, date.today())

    async def get_current_block(self, user_id: str) -> Block | None:
        """Get the user's currently in-progress block."""
        return await self._blocks.get_current_block(user_id)

    async def list_blocks_for_mission(
        self,
        mission_id: str,
        *,
        status: BlockStatus | None = None,
    ) -> list[Block]:
        """List blocks for a mission."""
        return await self._blocks.list_for_mission(mission_id, status=status)

    async def get_next_planned_block(
        self,
        user_id: str,
        mission_id: str | None = None,
    ) -> Block | None:
        """Get the next planned block for a user.

        If mission_id is provided, only looks at blocks for that mission.
        """
        if mission_id:
            blocks = await self._blocks.list_for_mission(
                mission_id, status=BlockStatus.PLANNED
            )
        else:
            # Get today's blocks that are still planned
            today_blocks = await self.get_today_blocks(user_id)
            blocks = [b for b in today_blocks if b.status == BlockStatus.PLANNED]

        if not blocks:
            return None

        # Return the one scheduled earliest
        blocks_with_schedule = [b for b in blocks if b.scheduled_start]
        if blocks_with_schedule:
            return min(
                blocks_with_schedule, key=lambda b: b.scheduled_start or datetime.max
            )

        return blocks[0]  # Return first by sequence if no scheduled times

    async def update_block_plan(
        self,
        block_id: str,
        *,
        title: str | None = None,
        plan_note: str | None = None,
        planned_duration_minutes: int | None = None,
    ) -> Block | None:
        """Update a block's plan before starting."""
        block = await self._blocks.get(block_id)
        if not block:
            return None

        updates: dict[str, object] = {}
        if title is not None:
            updates["title"] = title
        if plan_note is not None:
            updates["plan_note"] = plan_note
        if planned_duration_minutes is not None:
            updates["planned_duration_minutes"] = planned_duration_minutes

        if not updates:
            return block

        updated = block.model_copy(update=updates)
        return await self._blocks.update(updated)
