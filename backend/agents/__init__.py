"""
Agent Manager for Open-Deep-Coder

Coordinates the multi-agent workflow with specialized agents for different development tasks.
"""

import asyncio
import logging
import os
import sys
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

try:
    from backend.api.models import AgentStatus, TaskResult
    from backend.integrations.llm import LLMManager
except ImportError:
    try:
        from api.models import AgentStatus, TaskResult
        from integrations.llm import LLMManager
    except ImportError:
        # Minimal fallback
        LLMManager = None
        AgentStatus = None
        TaskResult = None

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    ORCHESTRATOR = "orchestrator"
    PLANNER = "planner"
    IMPLEMENTER = "implementer"
    VERIFIER = "verifier"
    REVIEWER = "reviewer"
    RESEARCHER = "researcher"


class AgentState(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    PAUSED = "paused"


class Agent:
    """Base agent class"""

    def __init__(self, agent_type: AgentType, llm_manager: LLMManager):
        self.type = agent_type
        self.llm_manager = llm_manager
        self.status = AgentState.IDLE
        self.current_task: str | None = None
        self.progress: float = 0.0
        self.last_result: dict[str, Any] | None = None
        self.error: str | None = None
        self.started_at: datetime | None = None
        self.updated_at: datetime = datetime.now()

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Execute a task - to be implemented by subclasses"""
        raise NotImplementedError

    def update_status(
        self, status: AgentState, progress: float = None, error: str = None
    ):
        """Update agent status"""
        self.status = status
        if progress is not None:
            self.progress = progress
        if error is not None:
            self.error = error
        self.updated_at = datetime.now()


class OrchestratorAgent(Agent):
    """Coordinates the overall workflow and manages other agents"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.ORCHESTRATOR, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Coordinate the multi-agent workflow"""
        self.update_status(AgentState.RUNNING, 0.1)

        try:
            # Analyze the task and create execution plan
            plan = await self._create_execution_plan(task, context)
            self.update_status(AgentState.RUNNING, 0.3)

            # Execute the plan using other agents
            results = await self._execute_plan(plan, context)
            self.update_status(AgentState.RUNNING, 0.9)

            # Finalize and return results
            final_result = await self._finalize_results(results)
            self.update_status(AgentState.SUCCESS, 1.0)

            return final_result

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _create_execution_plan(
        self, task: str, context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Create an execution plan using LLM"""
        messages = [
            {
                "role": "system",
                "content": "You are an orchestrator agent that creates execution plans for development tasks. Break down the task into steps for different specialized agents: planner, implementer, verifier, reviewer, researcher.",
            },
            {"role": "user", "content": f"Create an execution plan for: {task}"},
        ]

        response = await self.llm_manager.chat_completion(
            messages, context={"task_type": "planning"}
        )
        return {"plan": response.message.content, "task": task}

    async def _execute_plan(
        self, plan: dict[str, Any], context: dict[str, Any] | None
    ) -> list[dict[str, Any]]:
        """Execute the plan using appropriate agents"""
        # This would coordinate with other agents
        # For now, return mock results
        return [{"step": "plan_created", "result": plan}]

    async def _finalize_results(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """Finalize and summarize results"""
        return {
            "status": "completed",
            "results": results,
            "summary": "Task orchestration completed successfully",
        }


class PlannerAgent(Agent):
    """Analyzes requirements and creates detailed task breakdowns"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.PLANNER, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Create a detailed plan for the given task"""
        self.update_status(AgentState.RUNNING, 0.2)

        try:
            # Analyze the task
            analysis = await self._analyze_task(task, context)
            self.update_status(AgentState.RUNNING, 0.5)

            # Create detailed plan
            plan = await self._create_detailed_plan(analysis, context)
            self.update_status(AgentState.RUNNING, 0.8)

            # Validate plan
            validated_plan = await self._validate_plan(plan)
            self.update_status(AgentState.SUCCESS, 1.0)

            return validated_plan

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _analyze_task(
        self, task: str, context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Analyze the task requirements"""
        messages = [
            {
                "role": "system",
                "content": "You are a planner agent that analyzes development tasks. Break down requirements, identify dependencies, and assess complexity.",
            },
            {"role": "user", "content": f"Analyze this task: {task}"},
        ]

        response = await self.llm_manager.chat_completion(
            messages, context={"task_type": "planning"}
        )
        return {"analysis": response.message.content, "task": task}

    async def _create_detailed_plan(
        self, analysis: dict[str, Any], context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Create a detailed implementation plan"""
        # Use LLM to create detailed plan based on analysis
        return {"plan": "Detailed plan created", "analysis": analysis}

    async def _validate_plan(self, plan: dict[str, Any]) -> dict[str, Any]:
        """Validate the created plan"""
        plan["validated"] = True
        plan["validation_timestamp"] = datetime.now().isoformat()
        return plan


class ImplementerAgent(Agent):
    """Generates and modifies code based on plans and requirements"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.IMPLEMENTER, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Implement code changes based on the task"""
        self.update_status(AgentState.RUNNING, 0.1)

        try:
            # Analyze code requirements
            requirements = await self._analyze_code_requirements(task, context)
            self.update_status(AgentState.RUNNING, 0.3)

            # Generate code
            code = await self._generate_code(requirements, context)
            self.update_status(AgentState.RUNNING, 0.7)

            # Create tests
            tests = await self._generate_tests(code, context)
            self.update_status(AgentState.RUNNING, 0.9)

            result = {"code": code, "tests": tests, "requirements": requirements}

            self.update_status(AgentState.SUCCESS, 1.0)
            return result

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _analyze_code_requirements(
        self, task: str, context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Analyze what code needs to be implemented"""
        messages = [
            {
                "role": "system",
                "content": "You are an implementer agent that analyzes code requirements. Identify what code needs to be written, modified, or refactored.",
            },
            {"role": "user", "content": f"Analyze code requirements for: {task}"},
        ]

        response = await self.llm_manager.chat_completion(
            messages, context={"task_type": "code"}
        )
        return {"requirements": response.message.content, "task": task}

    async def _generate_code(
        self, requirements: dict[str, Any], context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Generate code based on requirements"""
        # Use LLM to generate code
        return {"generated": True, "code": "// Generated code placeholder"}

    async def _generate_tests(
        self, code: dict[str, Any], context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Generate tests for the code"""
        return {"tests": "// Generated test placeholder"}


class VerifierAgent(Agent):
    """Runs tests, linting, and quality checks"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.VERIFIER, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Verify code quality and run tests"""
        self.update_status(AgentState.RUNNING, 0.2)

        try:
            # Run tests
            test_results = await self._run_tests(context)
            self.update_status(AgentState.RUNNING, 0.5)

            # Run linting
            lint_results = await self._run_linting(context)
            self.update_status(AgentState.RUNNING, 0.7)

            # Check coverage
            coverage_results = await self._check_coverage(context)
            self.update_status(AgentState.RUNNING, 0.9)

            # Generate report
            report = await self._generate_report(
                test_results, lint_results, coverage_results
            )

            self.update_status(AgentState.SUCCESS, 1.0)
            return report

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _run_tests(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Run test suite"""
        # Mock test results
        return {"passed": 23, "failed": 0, "skipped": 2, "total": 25, "success": True}

    async def _run_linting(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Run code linting"""
        return {"errors": 0, "warnings": 1, "clean": True}

    async def _check_coverage(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Check test coverage"""
        return {"coverage": 85.2, "threshold": 70.0, "meets_threshold": True}

    async def _generate_report(
        self, test_results, lint_results, coverage_results
    ) -> dict[str, Any]:
        """Generate verification report"""
        return {
            "tests": test_results,
            "linting": lint_results,
            "coverage": coverage_results,
            "overall_status": "passed",
            "timestamp": datetime.now().isoformat(),
        }


class ReviewerAgent(Agent):
    """Reviews code for security, quality, and best practices"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.REVIEWER, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Review code for security and quality"""
        self.update_status(AgentState.RUNNING, 0.2)

        try:
            # Security review
            security_review = await self._security_review(context)
            self.update_status(AgentState.RUNNING, 0.5)

            # Quality review
            quality_review = await self._quality_review(context)
            self.update_status(AgentState.RUNNING, 0.8)

            # Generate final review
            final_review = await self._generate_final_review(
                security_review, quality_review
            )

            self.update_status(AgentState.SUCCESS, 1.0)
            return final_review

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _security_review(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Perform security review"""
        return {
            "vulnerabilities": 0,
            "warnings": 1,
            "secure": True,
            "findings": ["Consider adding input validation"],
        }

    async def _quality_review(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Perform code quality review"""
        return {
            "maintainability": "good",
            "readability": "excellent",
            "performance": "good",
            "suggestions": ["Consider extracting common logic into utilities"],
        }

    async def _generate_final_review(
        self, security_review, quality_review
    ) -> dict[str, Any]:
        """Generate final review report"""
        return {
            "security": security_review,
            "quality": quality_review,
            "approval": "approved",
            "timestamp": datetime.now().isoformat(),
        }


class ResearcherAgent(Agent):
    """Looks up documentation, best practices, and external knowledge"""

    def __init__(self, llm_manager: LLMManager):
        super().__init__(AgentType.RESEARCHER, llm_manager)

    async def execute(
        self, task: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Research information related to the task"""
        self.update_status(AgentState.RUNNING, 0.3)

        try:
            # Research documentation
            docs = await self._research_documentation(task, context)
            self.update_status(AgentState.RUNNING, 0.6)

            # Find best practices
            best_practices = await self._find_best_practices(task, context)
            self.update_status(AgentState.RUNNING, 0.9)

            # Compile research report
            report = await self._compile_research_report(docs, best_practices)

            self.update_status(AgentState.SUCCESS, 1.0)
            return report

        except Exception as e:
            self.update_status(AgentState.ERROR, error=str(e))
            raise

    async def _research_documentation(
        self, task: str, context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Research relevant documentation"""
        messages = [
            {
                "role": "system",
                "content": "You are a researcher agent that finds relevant documentation and resources for development tasks.",
            },
            {"role": "user", "content": f"Research documentation for: {task}"},
        ]

        response = await self.llm_manager.chat_completion(
            messages, context={"task_type": "documentation"}
        )
        return {"documentation": response.message.content}

    async def _find_best_practices(
        self, task: str, context: dict[str, Any] | None
    ) -> dict[str, Any]:
        """Find best practices for the task"""
        return {"best_practices": "Industry standard best practices identified"}

    async def _compile_research_report(self, docs, best_practices) -> dict[str, Any]:
        """Compile research findings into a report"""
        return {
            "documentation": docs,
            "best_practices": best_practices,
            "recommendations": "Follow documented patterns and industry standards",
            "timestamp": datetime.now().isoformat(),
        }


class AgentManager:
    """Manages all agents and coordinates their interactions"""

    def __init__(self, llm_manager: LLMManager):
        self.llm_manager = llm_manager
        self.agents: dict[AgentType, Agent] = {
            AgentType.ORCHESTRATOR: OrchestratorAgent(llm_manager),
            AgentType.PLANNER: PlannerAgent(llm_manager),
            AgentType.IMPLEMENTER: ImplementerAgent(llm_manager),
            AgentType.VERIFIER: VerifierAgent(llm_manager),
            AgentType.REVIEWER: ReviewerAgent(llm_manager),
            AgentType.RESEARCHER: ResearcherAgent(llm_manager),
        }
        self.running_tasks: dict[str, asyncio.Task] = {}

    async def initialize(self):
        """Initialize the agent manager"""
        logger.info("Agent Manager initialized with all agents ready")

    async def cleanup(self):
        """Cleanup running tasks"""
        for task_id, task in self.running_tasks.items():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        self.running_tasks.clear()

    def is_ready(self) -> bool:
        """Check if the manager is ready"""
        return True

    async def get_all_status(self) -> list[AgentStatus]:
        """Get status of all agents"""
        status_list = []
        for agent_type, agent in self.agents.items():
            status = AgentStatus(
                type=agent_type.value,
                status=agent.status.value,
                current_task=agent.current_task,
                progress=agent.progress,
                last_result=agent.last_result,
                error=agent.error,
                started_at=agent.started_at,
                updated_at=agent.updated_at,
            )
            status_list.append(status)
        return status_list

    async def run_agent(
        self, agent_type: str, task: str, context: dict[str, Any] | None = None
    ) -> str:
        """Run a specific agent with a task"""
        try:
            agent_enum = AgentType(agent_type)
        except ValueError:
            raise ValueError(f"Unknown agent type: {agent_type}")

        agent = self.agents[agent_enum]

        # Set task and start execution
        agent.current_task = task
        agent.started_at = datetime.now()

        # Create and store the async task
        task_id = f"{agent_type}_{datetime.now().timestamp()}"
        async_task = asyncio.create_task(agent.execute(task, context))
        self.running_tasks[task_id] = async_task

        # Don't await - let it run in background
        return task_id

    async def stop_agent(self, agent_type: str):
        """Stop a specific agent"""
        try:
            agent_enum = AgentType(agent_type)
        except ValueError:
            raise ValueError(f"Unknown agent type: {agent_type}")

        agent = self.agents[agent_enum]
        agent.update_status(AgentState.IDLE)
        agent.current_task = None
        agent.started_at = None

        # Cancel any running tasks for this agent
        tasks_to_cancel = [
            task_id
            for task_id in self.running_tasks.keys()
            if task_id.startswith(agent_type)
        ]

        for task_id in tasks_to_cancel:
            task = self.running_tasks.pop(task_id)
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    async def stop_all_agents(self):
        """Stop all running agents"""
        for agent in self.agents.values():
            agent.update_status(AgentState.IDLE)
            agent.current_task = None
            agent.started_at = None

        # Cancel all running tasks
        for task in self.running_tasks.values():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        self.running_tasks.clear()
