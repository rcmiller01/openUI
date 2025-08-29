"""
n8n Manager for Open-Deep-Coder

Manages n8n workflow automation integrations for CI/CD, git operations,
and development process automation.
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class WorkflowStatus(str, Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    PAUSED = "paused"


class ExecutionStatus(str, Enum):
    NEW = "new"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    CANCELED = "canceled"
    WAITING = "waiting"


@dataclass
class WorkflowExecution:
    id: str
    workflow_id: str
    status: ExecutionStatus
    start_time: datetime
    end_time: datetime | None = None
    data: dict[str, Any] | None = None
    error: str | None = None


@dataclass
class N8NWorkflow:
    id: str
    name: str
    status: WorkflowStatus
    nodes: list[dict[str, Any]]
    connections: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    tags: list[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class N8NManager:
    """Manages n8n workflow automation"""

    def __init__(self, n8n_url: str = "http://192.168.50.145:5678"):
        self.workflows: dict[str, N8NWorkflow] = {}
        self.executions: dict[str, WorkflowExecution] = {}
        self.is_initialized = False
        self.n8n_url = n8n_url.rstrip("/")
        self.client: httpx.AsyncClient | None = None
        self.api_key: str | None = None

        # Pre-configured workflow templates
        self.workflow_templates = {
            "git_commit_workflow": self._create_git_commit_workflow_template(),
            "code_review_workflow": self._create_code_review_workflow_template(),
            "deployment_workflow": self._create_deployment_workflow_template(),
            "testing_workflow": self._create_testing_workflow_template(),
            "documentation_workflow": self._create_documentation_workflow_template(),
        }

    async def initialize(self, api_key: str | None = None):
        """Initialize n8n manager and test connection"""
        logger.info(f"Initializing n8n Manager with URL: {self.n8n_url}")

        self.api_key = api_key
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-N8N-API-KEY"] = self.api_key

        self.client = httpx.AsyncClient(
            base_url=f"{self.n8n_url}/api/v1", headers=headers, timeout=30.0
        )

        # Test connection
        try:
            response = await self.client.get("/workflows")
            if response.status_code == 200:
                logger.info("Successfully connected to n8n server")
                await self._sync_workflows()
                self.is_initialized = True
            else:
                logger.error(f"Failed to connect to n8n: {response.status_code}")
        except Exception as e:
            logger.error(f"Error connecting to n8n: {e}")

        logger.info(f"n8n Manager initialized with {len(self.workflows)} workflows")

    async def cleanup(self):
        """Cleanup n8n connections"""
        if self.client:
            await self.client.aclose()
        self.workflows.clear()
        self.executions.clear()

    async def _sync_workflows(self):
        """Sync workflows from n8n server"""
        try:
            response = await self.client.get("/workflows")
            if response.status_code == 200:
                workflows_data = response.json()
                for workflow_data in workflows_data.get("data", []):
                    workflow = N8NWorkflow(
                        id=workflow_data["id"],
                        name=workflow_data["name"],
                        status=WorkflowStatus(
                            workflow_data.get("active", False)
                            and "active"
                            or "inactive"
                        ),
                        nodes=workflow_data.get("nodes", []),
                        connections=workflow_data.get("connections", {}),
                        created_at=datetime.fromisoformat(
                            workflow_data["createdAt"].replace("Z", "+00:00")
                        ),
                        updated_at=datetime.fromisoformat(
                            workflow_data["updatedAt"].replace("Z", "+00:00")
                        ),
                        tags=workflow_data.get("tags", []),
                    )
                    self.workflows[workflow.id] = workflow
        except Exception as e:
            logger.error(f"Error syncing workflows: {e}")

    async def create_workflow(self, workflow_definition: dict[str, Any]) -> str | None:
        """Create a new n8n workflow"""
        try:
            response = await self.client.post("/workflows", json=workflow_definition)
            if response.status_code == 200:
                workflow_data = response.json()
                workflow_id = workflow_data["id"]

                # Add to local cache
                workflow = N8NWorkflow(
                    id=workflow_id,
                    name=workflow_data["name"],
                    status=WorkflowStatus.INACTIVE,
                    nodes=workflow_data.get("nodes", []),
                    connections=workflow_data.get("connections", {}),
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    tags=workflow_data.get("tags", []),
                )
                self.workflows[workflow_id] = workflow

                logger.info(
                    f"Created n8n workflow: {workflow_data['name']} ({workflow_id})"
                )
                return workflow_id
            else:
                logger.error(
                    f"Failed to create workflow: {response.status_code} - {response.text}"
                )
                return None
        except Exception as e:
            logger.error(f"Error creating workflow: {e}")
            return None

    async def activate_workflow(self, workflow_id: str) -> bool:
        """Activate a workflow"""
        try:
            response = await self.client.post(f"/workflows/{workflow_id}/activate")
            if response.status_code == 200:
                if workflow_id in self.workflows:
                    self.workflows[workflow_id].status = WorkflowStatus.ACTIVE
                logger.info(f"Activated workflow: {workflow_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error activating workflow {workflow_id}: {e}")
            return False

    async def deactivate_workflow(self, workflow_id: str) -> bool:
        """Deactivate a workflow"""
        try:
            response = await self.client.post(f"/workflows/{workflow_id}/deactivate")
            if response.status_code == 200:
                if workflow_id in self.workflows:
                    self.workflows[workflow_id].status = WorkflowStatus.INACTIVE
                logger.info(f"Deactivated workflow: {workflow_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deactivating workflow {workflow_id}: {e}")
            return False

    async def execute_workflow(
        self, workflow_id: str, data: dict[str, Any] | None = None
    ) -> str | None:
        """Execute a workflow manually"""
        try:
            payload = {"workflowData": data or {}}
            response = await self.client.post(
                f"/workflows/{workflow_id}/execute", json=payload
            )

            if response.status_code == 200:
                execution_data = response.json()
                execution_id = execution_data["id"]

                # Track execution
                execution = WorkflowExecution(
                    id=execution_id,
                    workflow_id=workflow_id,
                    status=ExecutionStatus(
                        execution_data.get("finished", False) and "success" or "running"
                    ),
                    start_time=datetime.now(),
                    data=data,
                )
                self.executions[execution_id] = execution

                logger.info(f"Started workflow execution: {execution_id}")
                return execution_id
            else:
                logger.error(
                    f"Failed to execute workflow: {response.status_code} - {response.text}"
                )
                return None
        except Exception as e:
            logger.error(f"Error executing workflow {workflow_id}: {e}")
            return None

    async def get_execution_status(self, execution_id: str) -> WorkflowExecution | None:
        """Get the status of a workflow execution"""
        try:
            response = await self.client.get(f"/executions/{execution_id}")
            if response.status_code == 200:
                execution_data = response.json()

                # Update local execution
                if execution_id in self.executions:
                    execution = self.executions[execution_id]
                    execution.status = ExecutionStatus(
                        execution_data.get("finished", False) and "success" or "running"
                    )
                    if execution_data.get("stoppedAt"):
                        execution.end_time = datetime.fromisoformat(
                            execution_data["stoppedAt"].replace("Z", "+00:00")
                        )
                    return execution

                # Create new execution record if not exists
                execution = WorkflowExecution(
                    id=execution_id,
                    workflow_id=execution_data["workflowId"],
                    status=ExecutionStatus(
                        execution_data.get("finished", False) and "success" or "running"
                    ),
                    start_time=datetime.fromisoformat(
                        execution_data["startedAt"].replace("Z", "+00:00")
                    ),
                    end_time=execution_data.get("stoppedAt")
                    and datetime.fromisoformat(
                        execution_data["stoppedAt"].replace("Z", "+00:00")
                    )
                    or None,
                )
                self.executions[execution_id] = execution
                return execution
            return None
        except Exception as e:
            logger.error(f"Error getting execution status {execution_id}: {e}")
            return None

    async def wait_for_execution(
        self, execution_id: str, timeout: float = 300.0
    ) -> bool:
        """Wait for a workflow execution to complete"""
        start_time = asyncio.get_event_loop().time()

        while True:
            execution = await self.get_execution_status(execution_id)
            if not execution:
                return False

            if execution.status in [
                ExecutionStatus.SUCCESS,
                ExecutionStatus.ERROR,
                ExecutionStatus.CANCELED,
            ]:
                return execution.status == ExecutionStatus.SUCCESS

            # Check timeout
            if asyncio.get_event_loop().time() - start_time > timeout:
                logger.warning(f"Execution {execution_id} timed out")
                return False

            await asyncio.sleep(2.0)

    def get_workflow_status(self) -> list[dict[str, Any]]:
        """Get status of all workflows"""
        return [
            {
                "id": workflow.id,
                "name": workflow.name,
                "status": workflow.status.value,
                "nodes_count": len(workflow.nodes),
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat(),
                "tags": workflow.tags,
            }
            for workflow in self.workflows.values()
        ]

    # Git integration workflows

    async def setup_git_integration_workflow(self, repository_path: str) -> str | None:
        """Setup automated git integration workflow"""
        workflow_def = self.workflow_templates["git_commit_workflow"]
        workflow_def["name"] = f"Git Integration - {repository_path}"

        # Customize workflow for specific repository
        for node in workflow_def["nodes"]:
            if node.get("type") == "n8n-nodes-base.executeWorkflow":
                node["parameters"]["repository_path"] = repository_path

        workflow_id = await self.create_workflow(workflow_def)
        if workflow_id:
            await self.activate_workflow(workflow_id)
        return workflow_id

    async def trigger_git_commit_workflow(
        self, repository_path: str, commit_message: str, files: list[str]
    ) -> str | None:
        """Trigger git commit workflow"""
        # Find the git workflow for this repository
        git_workflow_id = None
        for workflow in self.workflows.values():
            if "Git Integration" in workflow.name and repository_path in workflow.name:
                git_workflow_id = workflow.id
                break

        if not git_workflow_id:
            git_workflow_id = await self.setup_git_integration_workflow(repository_path)

        if git_workflow_id:
            return await self.execute_workflow(
                git_workflow_id,
                {
                    "repository_path": repository_path,
                    "commit_message": commit_message,
                    "files": files,
                    "timestamp": datetime.now().isoformat(),
                },
            )
        return None

    async def trigger_code_review_workflow(
        self, repository_path: str, branch: str, pull_request_url: str
    ) -> str | None:
        """Trigger automated code review workflow"""
        workflow_def = self.workflow_templates["code_review_workflow"]
        workflow_id = await self.create_workflow(workflow_def)

        if workflow_id:
            await self.activate_workflow(workflow_id)
            return await self.execute_workflow(
                workflow_id,
                {
                    "repository_path": repository_path,
                    "branch": branch,
                    "pull_request_url": pull_request_url,
                    "timestamp": datetime.now().isoformat(),
                },
            )
        return None

    # Workflow template creation methods

    def _create_git_commit_workflow_template(self) -> dict[str, Any]:
        """Create git commit workflow template"""
        return {
            "name": "Git Commit Automation",
            "nodes": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "position": [240, 300],
                    "parameters": {},
                },
                {
                    "id": "git-add",
                    "name": "Git Add",
                    "type": "n8n-nodes-base.executeCommand",
                    "position": [460, 300],
                    "parameters": {
                        "command": "git add {{ $json.files.join(' ') }}",
                        "cwd": "{{ $json.repository_path }}",
                    },
                },
                {
                    "id": "git-commit",
                    "name": "Git Commit",
                    "type": "n8n-nodes-base.executeCommand",
                    "position": [680, 300],
                    "parameters": {
                        "command": 'git commit -m "{{ $json.commit_message }}"',
                        "cwd": "{{ $json.repository_path }}",
                    },
                },
                {
                    "id": "notify",
                    "name": "Notify Completion",
                    "type": "n8n-nodes-base.set",
                    "position": [900, 300],
                    "parameters": {
                        "values": {
                            "string": [
                                {"name": "status", "value": "completed"},
                                {
                                    "name": "message",
                                    "value": "Git commit completed successfully",
                                },
                            ]
                        }
                    },
                },
            ],
            "connections": {
                "Start": {"main": [[{"node": "Git Add", "type": "main", "index": 0}]]},
                "Git Add": {
                    "main": [[{"node": "Git Commit", "type": "main", "index": 0}]]
                },
                "Git Commit": {
                    "main": [
                        [{"node": "Notify Completion", "type": "main", "index": 0}]
                    ]
                },
            },
            "active": False,
            "settings": {},
            "tags": ["git", "automation", "open-deep-coder"],
        }

    def _create_code_review_workflow_template(self) -> dict[str, Any]:
        """Create code review workflow template"""
        return {
            "name": "Automated Code Review",
            "nodes": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "position": [240, 300],
                    "parameters": {},
                },
                {
                    "id": "run-linter",
                    "name": "Run Linter",
                    "type": "n8n-nodes-base.executeCommand",
                    "position": [460, 300],
                    "parameters": {
                        "command": "ruff check .",
                        "cwd": "{{ $json.repository_path }}",
                    },
                },
                {
                    "id": "run-tests",
                    "name": "Run Tests",
                    "type": "n8n-nodes-base.executeCommand",
                    "position": [680, 300],
                    "parameters": {
                        "command": "pytest --cov=src --cov-report=json",
                        "cwd": "{{ $json.repository_path }}",
                    },
                },
                {
                    "id": "security-scan",
                    "name": "Security Scan",
                    "type": "n8n-nodes-base.executeCommand",
                    "position": [900, 300],
                    "parameters": {
                        "command": "bandit -r src/",
                        "cwd": "{{ $json.repository_path }}",
                    },
                },
            ],
            "connections": {
                "Start": {
                    "main": [[{"node": "Run Linter", "type": "main", "index": 0}]]
                },
                "Run Linter": {
                    "main": [[{"node": "Run Tests", "type": "main", "index": 0}]]
                },
                "Run Tests": {
                    "main": [[{"node": "Security Scan", "type": "main", "index": 0}]]
                },
            },
            "active": False,
            "settings": {},
            "tags": ["code-review", "automation", "open-deep-coder"],
        }

    def _create_deployment_workflow_template(self) -> dict[str, Any]:
        """Create deployment workflow template"""
        return {
            "name": "Deployment Automation",
            "nodes": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "position": [240, 300],
                    "parameters": {},
                }
            ],
            "connections": {},
            "active": False,
            "settings": {},
            "tags": ["deployment", "automation", "open-deep-coder"],
        }

    def _create_testing_workflow_template(self) -> dict[str, Any]:
        """Create testing workflow template"""
        return {
            "name": "Automated Testing",
            "nodes": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "position": [240, 300],
                    "parameters": {},
                }
            ],
            "connections": {},
            "active": False,
            "settings": {},
            "tags": ["testing", "automation", "open-deep-coder"],
        }

    def _create_documentation_workflow_template(self) -> dict[str, Any]:
        """Create documentation workflow template"""
        return {
            "name": "Documentation Generation",
            "nodes": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "position": [240, 300],
                    "parameters": {},
                }
            ],
            "connections": {},
            "active": False,
            "settings": {},
            "tags": ["documentation", "automation", "open-deep-coder"],
        }
