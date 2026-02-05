"""Planner graph - LangGraph workflow for mission planning.

Takes vague user input and produces structured missions with block proposals.
"""

from datetime import date, datetime

from langgraph.graph import END, StateGraph

from cyntra.agents.memory.interfaces import RepositoryBundle
from cyntra.agents.schemas import (
    Mission,
    MissionKind,
    MissionPriority,
    MissionStatus,
    PlanMissionRequest,
    PlanMissionResponse,
    ProposedBlock,
)
from cyntra.agents.tools import MemoryTools, MissionTools, TimelineTools

from .base import GlyphStateDict


class PlannerGraph:
    """Graph for planning missions.

    Nodes:
    1. parse_input - Extract structured info from raw user input
    2. check_history - Look for similar past missions
    3. build_mission - Create the mission object
    4. propose_blocks - Generate initial block schedule
    5. summarize - Create response summary
    """

    def __init__(
        self,
        repos: RepositoryBundle,
    ) -> None:
        self._repos = repos
        self._mission_tools = MissionTools(repos.missions, repos.semantic_memory)
        self._timeline_tools = TimelineTools(repos.blocks, repos.missions)
        self._memory_tools = MemoryTools(
            repos.episodes, repos.profiles, repos.semantic_memory
        )

    def _parse_input(self, state: GlyphStateDict) -> GlyphStateDict:
        """Parse the raw input to extract mission details.

        This is a simplified version - a full implementation would use
        an LLM call to parse natural language.
        """
        request_data = state.get("outputs", {}).get("request", {})

        # Extract what we can from the request
        parsed = {
            "title": request_data.get("raw_input", "Untitled Mission")[:100],
            "description": request_data.get("raw_input"),
            "kind": request_data.get("kind") or MissionKind.OTHER,
            "deadline": request_data.get("deadline"),
            "estimated_hours": request_data.get("estimated_hours"),
            "constraints": request_data.get("constraints"),
            "preferences": request_data.get("preferences"),
        }

        state["outputs"]["parsed_input"] = parsed
        state["scratchpad"] = (
            f"{state.get('scratchpad', '')}\nParsed input: {parsed['title']}"
        )
        return state

    async def _check_history(self, state: GlyphStateDict) -> GlyphStateDict:
        """Check for similar past missions."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        parsed = state.get("outputs", {}).get("parsed_input", {})

        # Search for similar missions
        query = f"{parsed.get('title', '')} {parsed.get('description', '')}"
        similar = await self._mission_tools.find_similar_missions(
            user_id, query, limit=3
        )

        history_note = None
        if similar:
            # Generate insight from past missions
            completed = [m for m in similar if m.status == MissionStatus.COMPLETED]
            if completed:
                history_note = f"Found {len(completed)} similar completed missions. Consider what worked before."

        state["outputs"]["similar_missions"] = [m.model_dump() for m in similar]
        state["outputs"]["history_note"] = history_note
        return state

    async def _build_mission(self, state: GlyphStateDict) -> GlyphStateDict:
        """Create the mission object."""
        context = state.get("context", {})
        user_id = context.get("user_id", "")
        parsed = state.get("outputs", {}).get("parsed_input", {})

        # Parse deadline if provided
        deadline_dt = None
        if parsed.get("deadline"):
            if isinstance(parsed["deadline"], str):
                deadline_dt = datetime.fromisoformat(parsed["deadline"])
            elif isinstance(parsed["deadline"], date):
                deadline_dt = datetime.combine(parsed["deadline"], datetime.min.time())

        # Estimate minutes from hours
        estimated_minutes = None
        if parsed.get("estimated_hours"):
            estimated_minutes = int(parsed["estimated_hours"] * 60)

        # Create the mission
        mission = await self._mission_tools.create_mission(
            user_id=user_id,
            title=parsed.get("title", "Untitled"),
            description=parsed.get("description"),
            kind=parsed.get("kind", MissionKind.OTHER),
            priority=MissionPriority.MEDIUM,
            deadline_date=deadline_dt,
            estimated_total_minutes=estimated_minutes,
            constraints=parsed.get("constraints"),
            preferences=parsed.get("preferences"),
        )

        state["outputs"]["mission"] = mission.model_dump()
        state["context"]["mission_id"] = mission.id
        return state

    async def _propose_blocks(self, state: GlyphStateDict) -> GlyphStateDict:
        """Generate proposed blocks for the mission."""
        mission_data = state.get("outputs", {}).get("mission", {})
        if not mission_data:
            state["errors"] = state.get("errors", []) + ["No mission created"]
            return state

        mission_id = mission_data["id"]

        # Propose blocks (not yet committed)
        proposed = await self._timeline_tools.propose_blocks_for_mission(
            mission_id,
            num_blocks=5,
        )

        # Convert to ProposedBlock format
        proposed_blocks = [
            ProposedBlock(
                title=b.title or "",
                plan_note=b.plan_note,
                suggested_date=b.scheduled_start.date() if b.scheduled_start else None,
                suggested_duration_minutes=b.planned_duration_minutes or 25,
                sequence_index=b.sequence_index or 0,
            )
            for b in proposed
        ]

        state["outputs"]["proposed_blocks"] = [b.model_dump() for b in proposed_blocks]
        return state

    def _summarize(self, state: GlyphStateDict) -> GlyphStateDict:
        """Create the response summary."""
        mission_data = state.get("outputs", {}).get("mission", {})
        proposed_blocks = state.get("outputs", {}).get("proposed_blocks", [])
        history_note = state.get("outputs", {}).get("history_note")

        # Build summary
        summary = f"Created mission: {mission_data.get('title', 'Untitled')}"
        if proposed_blocks:
            summary += f" with {len(proposed_blocks)} proposed sessions"

        # Build rationale
        rationale_parts = []
        if mission_data.get("deadline_date"):
            rationale_parts.append(f"Deadline: {mission_data['deadline_date']}")
        if mission_data.get("estimated_total_minutes"):
            hours = mission_data["estimated_total_minutes"] / 60
            rationale_parts.append(f"Estimated effort: {hours:.1f} hours")

        rationale = ". ".join(rationale_parts) if rationale_parts else None

        state["outputs"]["summary"] = summary
        state["outputs"]["rationale"] = rationale
        state["outputs"]["similar_missions_note"] = history_note

        return state

    def build(self) -> StateGraph:
        """Build the LangGraph StateGraph."""
        graph = StateGraph(dict)

        # Add nodes
        graph.add_node("parse_input", self._parse_input)
        graph.add_node("check_history", self._check_history)
        graph.add_node("build_mission", self._build_mission)
        graph.add_node("propose_blocks", self._propose_blocks)
        graph.add_node("summarize", self._summarize)

        # Define edges (linear flow for MVP)
        graph.set_entry_point("parse_input")
        graph.add_edge("parse_input", "check_history")
        graph.add_edge("check_history", "build_mission")
        graph.add_edge("build_mission", "propose_blocks")
        graph.add_edge("propose_blocks", "summarize")
        graph.add_edge("summarize", END)

        return graph


async def run_planner(
    repos: RepositoryBundle,
    user_id: str,
    request: PlanMissionRequest,
) -> PlanMissionResponse:
    """Run the planner graph and return a response."""
    planner = PlannerGraph(repos)
    graph = planner.build().compile()

    # Build initial state
    initial_state: GlyphStateDict = {
        "context": {
            "user_id": user_id,
            "surface": request.surface.value,
        },
        "mode": "planner",
        "messages": [],
        "scratchpad": "",
        "outputs": {
            "request": {
                "raw_input": request.raw_input,
                "kind": request.kind.value if request.kind else None,
                "deadline": request.deadline.isoformat() if request.deadline else None,
                "estimated_hours": request.estimated_hours,
                "constraints": (
                    request.constraints.model_dump() if request.constraints else None
                ),
                "preferences": (
                    request.preferences.model_dump() if request.preferences else None
                ),
            }
        },
        "errors": [],
    }

    # Run the graph
    final_state = await graph.ainvoke(initial_state)

    # Build response
    mission_data = final_state.get("outputs", {}).get("mission", {})
    proposed_blocks_data = final_state.get("outputs", {}).get("proposed_blocks", [])

    mission = (
        Mission(**mission_data)
        if mission_data
        else Mission(
            id="",
            user_id=user_id,
            title="Failed to create mission",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    )

    proposed_blocks = [ProposedBlock(**b) for b in proposed_blocks_data]

    return PlanMissionResponse(
        mission=mission,
        proposed_blocks=proposed_blocks,
        summary=final_state.get("outputs", {}).get("summary", ""),
        rationale=final_state.get("outputs", {}).get("rationale"),
        similar_missions_note=final_state.get("outputs", {}).get(
            "similar_missions_note"
        ),
        warnings=final_state.get("errors", []),
        suggestions=[],
    )
