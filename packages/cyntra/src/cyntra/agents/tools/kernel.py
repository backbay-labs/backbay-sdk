"""Kernel tools for the Kernel Orchestrator agent."""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from cyntra.commons import get_logger

logger = get_logger(__name__)


class KernelTools:
    """Tools for interacting with the Cyntra kernel CLI and repo artifacts."""

    def __init__(
        self,
        repo_root: Path | str | None = None,
        config_path: Path | str | None = None,
    ) -> None:
        self._repo_root = self._resolve_repo_root(repo_root)
        self._config_path = (
            Path(config_path).resolve()
            if config_path is not None
            else (self._repo_root / ".cyntra" / "config.yaml").resolve()
        )
        self._kernel_src = (self._repo_root / "kernel" / "src").resolve()

    def _resolve_repo_root(self, repo_root: Path | str | None) -> Path:
        if repo_root is not None:
            return Path(repo_root).resolve()
        return self._discover_repo_root(Path.cwd().resolve())

    def _discover_repo_root(self, start: Path) -> Path:
        for candidate in (start,) + tuple(start.parents):
            if (candidate / ".cyntra" / "config.yaml").exists():
                return candidate
            if (candidate / ".git").exists():
                return candidate
        return start

    def _resolve_repo_path(self, raw_path: str | Path) -> Path:
        path = Path(raw_path)
        if not path.is_absolute():
            path = self._repo_root / path
        resolved = path.resolve()
        try:
            resolved.relative_to(self._repo_root)
        except ValueError as exc:
            raise ValueError(f"Path must stay within repo root: {raw_path}") from exc
        return resolved

    def _build_env(self) -> dict[str, str]:
        env = os.environ.copy()
        existing = env.get("PYTHONPATH", "")
        if existing:
            env["PYTHONPATH"] = f"{self._kernel_src}{os.pathsep}{existing}"
        else:
            env["PYTHONPATH"] = str(self._kernel_src)
        env.setdefault("CYNTRA_CONFIG", str(self._config_path))
        return env

    def _build_base_command(self) -> list[str]:
        return [
            sys.executable,
            "-m",
            "cyntra.infra.cli.main",
            "--config",
            str(self._config_path),
        ]

    async def _run_command(
        self,
        args: list[str],
        *,
        timeout_seconds: int | None = None,
    ) -> dict[str, Any]:
        cmd = self._build_base_command() + args
        logger.debug("kernel_cli_command command=%s", " ".join(cmd))
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                cwd=self._repo_root,
                env=self._build_env(),
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            return {
                "command": cmd,
                "exit_code": -1,
                "stdout": exc.stdout or "",
                "stderr": "Kernel CLI timed out",
                "timeout_seconds": timeout_seconds,
            }
        except Exception as exc:
            return {
                "command": cmd,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Kernel CLI failed: {exc}",
            }

        return {
            "command": cmd,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    def _parse_json_output(self, output: str) -> Any | None:
        content = output.strip()
        if not content:
            return None
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None

    async def kernel_skill_run(
        self,
        skill_id: str,
        inputs: dict[str, Any] | None = None,
        inputs_file: str | None = None,
        trace_dir: str | None = None,
        no_trace: bool | None = None,
        workcell_id: str | None = None,
        issue_id: str | None = None,
        timeout_seconds: int | None = None,
    ) -> dict[str, Any]:
        """Run a Cyntra skill by skill_id."""
        if inputs is not None and inputs_file:
            raise ValueError("Provide either inputs or inputs_file, not both")

        args = ["skills", "run", skill_id, "--json"]

        if inputs is not None:
            serialized = json.dumps(inputs, default=str)
            args += ["--inputs-json", serialized]
        if inputs_file:
            resolved = self._resolve_repo_path(inputs_file)
            args += ["--inputs-file", str(resolved)]
        if trace_dir:
            resolved = self._resolve_repo_path(trace_dir)
            args += ["--trace-dir", str(resolved)]
        if no_trace:
            args.append("--no-trace")
        if workcell_id:
            args += ["--workcell-id", workcell_id]
        if issue_id:
            args += ["--issue-id", issue_id]

        payload = await self._run_command(args, timeout_seconds=timeout_seconds)
        parsed = self._parse_json_output(payload.get("stdout", ""))
        if parsed is not None:
            return {
                "success": payload.get("exit_code", 1) == 0,
                "data": parsed,
                "stderr": payload.get("stderr", ""),
            }
        return payload

    async def kernel_status(self, verbose: bool | None = None) -> dict[str, Any]:
        """Get kernel status as JSON."""
        args = ["status", "--json"]
        if verbose:
            args.append("--verbose")
        payload = await self._run_command(args)
        parsed = self._parse_json_output(payload.get("stdout", ""))
        if parsed is not None:
            return parsed
        return payload

    async def kernel_stats(
        self,
        cost: bool | None = None,
        success_rate: bool | None = None,
        timing: bool | None = None,
    ) -> dict[str, Any]:
        """Get kernel statistics output."""
        args = ["stats"]
        if cost:
            args.append("--cost")
        if success_rate:
            args.append("--success-rate")
        if timing:
            args.append("--time")
        return await self._run_command(args)

    async def kernel_run_once(
        self,
        issue_id: str | None = None,
        universe: str | None = None,
        max_concurrent: int | None = None,
        speculate: bool | None = None,
        dry_run: bool | None = None,
        timeout_seconds: int | None = None,
    ) -> dict[str, Any]:
        """Run the kernel loop once."""
        args = ["run", "--once"]
        if issue_id:
            args += ["--issue", issue_id]
        if universe:
            args += ["--universe", universe]
        if max_concurrent is not None:
            args += ["--max-concurrent", str(max_concurrent)]
        if speculate:
            args.append("--speculate")
        if dry_run:
            args.append("--dry-run")
        return await self._run_command(args, timeout_seconds=timeout_seconds)

    async def kernel_read_file(
        self,
        path: str,
        max_bytes: int | None = None,
    ) -> dict[str, Any]:
        """Read a text file from the repo with optional truncation."""
        resolved = self._resolve_repo_path(path)
        data = resolved.read_text(encoding="utf-8", errors="replace")
        if max_bytes is not None and max_bytes >= 0:
            truncated = len(data) > max_bytes
            data = data[:max_bytes]
        else:
            truncated = False
        return {
            "path": str(resolved),
            "content": data,
            "truncated": truncated,
        }

    async def kernel_write_file(
        self,
        path: str,
        content: str,
        mode: str | None = None,
    ) -> dict[str, Any]:
        """Write a text file within the repo."""
        if mode not in (None, "overwrite", "append"):
            raise ValueError("mode must be 'overwrite' or 'append'")
        resolved = self._resolve_repo_path(path)
        resolved.parent.mkdir(parents=True, exist_ok=True)
        write_mode = "a" if mode == "append" else "w"
        with resolved.open(write_mode, encoding="utf-8") as handle:
            handle.write(content)
        return {
            "path": str(resolved),
            "bytes_written": len(content.encode("utf-8")),
            "mode": "append" if write_mode == "a" else "overwrite",
        }
