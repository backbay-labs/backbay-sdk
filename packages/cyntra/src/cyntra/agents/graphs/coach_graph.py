"""Coach graph - LangGraph workflow for session guidance.

Helps users start and navigate focus sessions.
"""

from langgraph.graph import END, StateGraph

from cyntra.agents.memory.interfaces import RepositoryBundle
from cyntra.agents.schemas import (
    Block,
    BlockStatus,
    RunSessionRequest,
    RunSessionResponse,
    SessionAction,
)
from cyntra.agents.tools import MissionTools, TimelineTools, UITools

from .base import GlyphStateDict


class CoachGraph:
    """Graph for coaching focus sessions.

    Nodes:
    1. load_context - Load mission, block, and user state
    2. decide_block - Decide which block to work on
    3. generate_brief - Create session brief and actions
    4. start_session - Start the block and focus mode
    """

    def __init__(
        self,
        repos: RepositoryBundle,
    ) -> None:
        self._repos = repos
        self._mission_tools = MissionTools(repos.missions, repos.semantic_memory)
        self._timeline_tools = TimelineTools(repos.blocks, repos.missions)
        self._ui_tools = UITools()

    async def _load_context(self, state: GlyphStateDict) -> GlyphStateDict:
        """Load relevant context for the session."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        request_data = state.get("outputs", {}).get("request", {})

        # Load specified mission or active mission
        mission_id = request_data.get("mission_id")
        mission = None
        if mission_id:
            mission = await self._mission_tools.get_mission(mission_id)
        else:
            mission = await self._mission_tools.get_active_mission(user_id)

        # Load specified block or current block
        block_id = request_data.get("block_id")
        block = None
        if block_id:
            block = await self._timeline_tools.get_block(block_id)
        else:
            block = await self._timeline_tools.get_current_block(user_id)

        # Get today's blocks
        today_blocks = await self._timeline_tools.get_today_blocks(user_id)

        state["outputs"]["mission"] = mission.model_dump() if mission else None
        state["outputs"]["current_block"] = block.model_dump() if block else None
        state["outputs"]["today_blocks"] = [b.model_dump() for b in today_blocks]

        return state

    async def _decide_block(self, state: GlyphStateDict) -> GlyphStateDict:
        """Decide which block to work on."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        outputs = state.get("outputs", {})
        request_data = outputs.get("request", {})

        current_block = outputs.get("current_block")
        mission_data = outputs.get("mission")

        # If there's already an in-progress block, use it
        if (
            current_block
            and current_block.get("status") == BlockStatus.IN_PROGRESS.value
        ):
            state["outputs"]["selected_block"] = current_block
            state["outputs"]["is_continuation"] = True
            return state

        # If a specific block was requested
        if request_data.get("block_id"):
            block = await self._timeline_tools.get_block(request_data["block_id"])
            if block:
                state["outputs"]["selected_block"] = block.model_dump()
                state["outputs"]["is_continuation"] = False
                return state

        # Get next planned block
        mission_id = mission_data.get("id") if mission_data else None
        next_block = await self._timeline_tools.get_next_planned_block(
            user_id, mission_id
        )

        if next_block:
            state["outputs"]["selected_block"] = next_block.model_dump()
            state["outputs"]["is_continuation"] = False
        else:
            # Need to create a new block
            if mission_id:
                duration = request_data.get("available_minutes") or 25
                new_block = await self._timeline_tools.create_block(
                    user_id=user_id,
                    mission_id=mission_id,
                    planned_duration_minutes=duration,
                )
                state["outputs"]["selected_block"] = new_block.model_dump()
                state["outputs"]["is_continuation"] = False
            else:
                state["errors"] = state.get("errors", []) + [
                    "No mission or block available"
                ]

        return state

    def _generate_brief(self, state: GlyphStateDict) -> GlyphStateDict:
        """Generate the session brief and actions."""
        outputs = state.get("outputs", {})
        block_data = outputs.get("selected_block")
        mission_data = outputs.get("mission")

        if not block_data:
            state["outputs"][
                "brief"
            ] = "Let's get you started. What would you like to work on?"
            state["outputs"]["actions"] = []
            return state

        # Build brief message
        mission_title = (
            mission_data.get("title", "your work") if mission_data else "your work"
        )
        block_title = block_data.get("title", "Focus session")
        duration = block_data.get("planned_duration_minutes", 25)

        is_continuation = outputs.get("is_continuation", False)

        if is_continuation:
            brief = f"Continuing your session on {mission_title}. You've got this."
        else:
            brief = f"Let's do a {duration}-minute block on {mission_title}."
            if block_data.get("plan_note"):
                brief += f" Focus: {block_data['plan_note']}"

        # Generate actions
        actions = []
        if block_data.get("plan_note"):
            # Split plan note into actions
            actions.append(
                SessionAction(
                    description=block_data["plan_note"],
                    estimated_minutes=duration,
                )
            )
        else:
            # Default action
            actions.append(
                SessionAction(
                    description=f"Work on {block_title}",
                    estimated_minutes=duration,
                )
            )

        # Add stretch goal if there's time
        if duration >= 40:
            actions.append(
                SessionAction(
                    description="Review what you completed",
                    estimated_minutes=5,
                    is_stretch_goal=True,
                )
            )

        state["outputs"]["brief"] = brief
        state["outputs"]["actions"] = [a.model_dump() for a in actions]
        state["outputs"]["recommended_duration"] = duration

        return state

    async def _start_session(self, state: GlyphStateDict) -> GlyphStateDict:
        """Start the block and focus mode."""
        outputs = state.get("outputs", {})
        block_data = outputs.get("selected_block")

        if not block_data:
            return state

        # Start the block if not already in progress
        if block_data.get("status") != BlockStatus.IN_PROGRESS.value:
            block = await self._timeline_tools.start_block(block_data["id"])
            if block:
                state["outputs"]["selected_block"] = block.model_dump()

        # Activate focus mode
        duration = outputs.get("recommended_duration", 25)
        self._ui_tools.focus_mode_on(
            block_id=block_data["id"],
            duration_minutes=duration,
        )

        state["outputs"]["ui_state"] = {
            "focus_mode_active": True,
            "timer_running": True,
            "timer_remaining_seconds": duration * 60,
        }

        return state

    def build(self) -> StateGraph:
        """Build the LangGraph StateGraph."""
        graph = StateGraph(dict)

        # Add nodes
        graph.add_node("load_context", self._load_context)
        graph.add_node("decide_block", self._decide_block)
        graph.add_node("generate_brief", self._generate_brief)
        graph.add_node("start_session", self._start_session)

        # Define edges
        graph.set_entry_point("load_context")
        graph.add_edge("load_context", "decide_block")
        graph.add_edge("decide_block", "generate_brief")
        graph.add_edge("generate_brief", "start_session")
        graph.add_edge("start_session", END)

        return graph


async def run_coach(
    repos: RepositoryBundle,
    user_id: str,
    request: RunSessionRequest,
) -> RunSessionResponse:
    """Run the coach graph and return a response."""
    coach = CoachGraph(repos)
    graph = coach.build().compile()

    # Build initial state
    initial_state: GlyphStateDict = {
        "context": {
            "user_id": user_id,
            "surface": request.surface.value,
            "mission_id": request.mission_id,
            "block_id": request.block_id,
        },
        "mode": "coach",
        "messages": [],
        "scratchpad": "",
        "outputs": {
            "request": {
                "mission_id": request.mission_id,
                "block_id": request.block_id,
                "available_minutes": request.available_minutes,
                "energy_level": (
                    request.energy_level.value if request.energy_level else None
                ),
                "mood_note": request.mood_note,
                "is_continuation": request.is_continuation,
            }
        },
        "errors": [],
    }

    # Run the graph
    final_state = await graph.ainvoke(initial_state)

    # Build response
    outputs = final_state.get("outputs", {})
    block_data = outputs.get("selected_block", {})
    actions_data = outputs.get("actions", [])

    # Create block with defaults if none selected
    if block_data:
        block = Block(**block_data)
    else:
        from cyntra.commons import new_id

        block = Block(
            id=new_id(),
            user_id=user_id,
            mission_id="",
            status=BlockStatus.PLANNED,
        )

    actions = [SessionAction(**a) for a in actions_data]

    return RunSessionResponse(
        block=block,
        actions=actions,
        brief=outputs.get("brief", "Ready to focus?"),
        recommended_duration_minutes=outputs.get("recommended_duration", 25),
        show_timer=True,
        enable_leak_tracking=True,
        warnings=final_state.get("errors", []),
    )
