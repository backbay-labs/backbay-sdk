"""Kernel Orchestrator service facade."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from cyntra.commons import get_logger, new_id

from cyntra.agents.config import AgentSettings
from cyntra.agents.persona.kernel_orchestrator import (
    KernelOrchestratorPersona,
    create_kernel_orchestrator_persona,
    create_kernel_tool_registry,
)
from cyntra.agents.schemas import AgentMessage, AgentMessageRole, AgentResponse
from cyntra.agents.service.glyph_service import Telemetry
from cyntra.agents.tools.kernel import KernelTools

logger = get_logger(__name__)


class KernelOrchestratorService:
    """Service facade for the Kernel Orchestrator agent."""

    def __init__(
        self,
        config: AgentSettings,
        *,
        repo_root: Path | str | None = None,
        config_path: Path | str | None = None,
        telemetry: Telemetry | None = None,
    ) -> None:
        self._config = config
        self._telemetry = telemetry or Telemetry()
        self._kernel_tools = KernelTools(repo_root=repo_root, config_path=config_path)
        self._tool_registry = create_kernel_tool_registry(self._kernel_tools)
        self._sessions: dict[str, KernelOrchestratorPersona] = {}

        logger.info(
            "kernel_orchestrator_service_initialized model=%s",
            config.llm.default.model,
        )

    async def chat(
        self,
        message: str,
        *,
        session_id: str | None = None,
        extra_context: str | None = None,
    ) -> AgentResponse:
        """Send a message to the Kernel Orchestrator agent."""
        if not session_id:
            session_id = new_id()

        persona = self._sessions.get(session_id)
        if persona is None or extra_context is not None:
            persona = create_kernel_orchestrator_persona(
                settings=self._config,
                tool_registry=self._tool_registry,
                extra_context=extra_context,
                session_id=session_id,
            )
            self._sessions[session_id] = persona

            logger.debug(
                "kernel_orchestrator_session_created session_id=%s",
                session_id,
            )

        try:
            response_msg = await persona.send_message(message)
            response_content = response_msg.content
        except Exception as exc:
            logger.warning("kernel_orchestrator_chat_error error=%s", str(exc))
            response_content = "Kernel Orchestrator is unavailable (LLM service error)."

        self._telemetry.log_event(
            "kernel_orchestrator_chat",
            {
                "session_id": session_id,
                "message_length": len(message),
                "response_length": len(response_content),
            },
        )

        return AgentResponse(
            message=AgentMessage(
                role=AgentMessageRole.ASSISTANT,
                content=response_content,
            ),
            conversation_id=session_id,
            session_id=session_id,
        )

    async def skill_run(
        self,
        skill_id: str,
        *,
        inputs: dict[str, Any] | None = None,
        inputs_file: str | None = None,
        trace_dir: str | None = None,
        no_trace: bool | None = None,
        workcell_id: str | None = None,
        issue_id: str | None = None,
        timeout_seconds: int | None = None,
    ) -> dict[str, Any]:
        """Run a kernel skill directly."""
        return await self._kernel_tools.kernel_skill_run(
            skill_id=skill_id,
            inputs=inputs,
            inputs_file=inputs_file,
            trace_dir=trace_dir,
            no_trace=no_trace,
            workcell_id=workcell_id,
            issue_id=issue_id,
            timeout_seconds=timeout_seconds,
        )
