"""
Enhanced Agent Coordination for Open-Deep-Coder

Provides advanced coordination capabilities including dynamic agent spawning,
parallel task execution, workflow orchestration, and intelligent load balancing.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Set, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class TaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class AgentCapability(str, Enum):
    PLANNING = "planning"
    IMPLEMENTATION = "implementation"
    VERIFICATION = "verification"
    REVIEW = "review"
    RESEARCH = "research"
    ORCHESTRATION = "orchestration"
    DEBUGGING = "debugging"
    TESTING = "testing"

@dataclass
class Task:
    id: str
    type: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    created_at: datetime
    assigned_agent: Optional[str] = None
    dependencies: Set[str] = field(default_factory=set)
    prerequisites: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    estimated_duration: Optional[timedelta] = None
    actual_duration: Optional[timedelta] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

@dataclass
class AgentInfo:
    id: str
    type: str
    capabilities: Set[AgentCapability]
    status: str
    current_task: Optional[str] = None
    max_concurrent_tasks: int = 1
    current_tasks: Set[str] = field(default_factory=set)
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    last_activity: Optional[datetime] = None

@dataclass
class Workflow:
    id: str
    name: str
    tasks: List[Task]
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

class EnhancedAgentCoordinator:
    """Enhanced agent coordination with advanced workflow management"""
    
    def __init__(self):
        self.agents: Dict[str, AgentInfo] = {}
        self.tasks: Dict[str, Task] = {}
        self.workflows: Dict[str, Workflow] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.completed_tasks: Dict[str, Task] = {}
        self.is_initialized = False
        self._coordinator_task: Optional[asyncio.Task] = None
        self._performance_monitor_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.max_retries = 3
        self.task_timeout = timedelta(minutes=30)
        self.health_check_interval = timedelta(seconds=30)
        
        # Event callbacks
        self.event_callbacks: Dict[str, List[Callable]] = {
            "task_completed": [],
            "task_failed": [],
            "agent_idle": [],
            "workflow_completed": []
        }
    
    async def initialize(self):
        """Initialize the enhanced coordination system"""
        logger.info("Initializing Enhanced Agent Coordinator...")
        
        # Start coordination background tasks
        self._coordinator_task = asyncio.create_task(self._coordination_loop())
        self._performance_monitor_task = asyncio.create_task(self._performance_monitor())
        
        self.is_initialized = True
        logger.info("Enhanced Agent Coordinator initialized")
    
    async def cleanup(self):
        """Cleanup coordination system"""
        if self._coordinator_task:
            self._coordinator_task.cancel()
            try:
                await self._coordinator_task
            except asyncio.CancelledError:
                pass
        
        if self._performance_monitor_task:
            self._performance_monitor_task.cancel()
            try:
                await self._performance_monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Enhanced Agent Coordinator cleaned up")
    
    def register_agent(self, agent_id: str, agent_type: str, capabilities: List[AgentCapability],
                      max_concurrent_tasks: int = 1) -> bool:
        """Register a new agent with the coordinator"""
        if agent_id in self.agents:
            logger.warning(f"Agent {agent_id} already registered")
            return False
        
        agent_info = AgentInfo(
            id=agent_id,
            type=agent_type,
            capabilities=set(capabilities),
            status="idle",
            max_concurrent_tasks=max_concurrent_tasks,
            last_activity=datetime.now()
        )
        
        self.agents[agent_id] = agent_info
        logger.info(f"Registered agent {agent_id} with capabilities: {capabilities}")
        return True
    
    def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent"""
        if agent_id not in self.agents:
            return False
        
        agent = self.agents[agent_id]
        # Cancel any running tasks
        for task_id in agent.current_tasks.copy():
            if task_id in self.tasks:
                self.tasks[task_id].status = TaskStatus.CANCELLED
        
        del self.agents[agent_id]
        logger.info(f"Unregistered agent {agent_id}")
        return True
    
    async def submit_task(self, task_type: str, description: str, 
                         priority: TaskPriority = TaskPriority.NORMAL,
                         dependencies: Optional[List[str]] = None,
                         prerequisites: Optional[Dict[str, Any]] = None,
                         estimated_duration: Optional[timedelta] = None) -> str:
        """Submit a new task for execution"""
        task_id = str(uuid.uuid4())
        
        task = Task(
            id=task_id,
            type=task_type,
            description=description,
            priority=priority,
            status=TaskStatus.PENDING,
            created_at=datetime.now(),
            dependencies=set(dependencies or []),
            prerequisites=prerequisites or {},
            estimated_duration=estimated_duration
        )
        
        self.tasks[task_id] = task
        await self.task_queue.put(task_id)
        
        logger.info(f"Submitted task {task_id}: {description}")
        return task_id
    
    async def submit_workflow(self, workflow_name: str, task_definitions: List[Dict[str, Any]],
                             metadata: Optional[Dict[str, Any]] = None) -> str:
        """Submit a workflow containing multiple tasks"""
        workflow_id = str(uuid.uuid4())
        
        # Create tasks for the workflow
        workflow_tasks = []
        for task_def in task_definitions:
            task_id = await self.submit_task(
                task_type=task_def.get("type", "generic"),
                description=task_def.get("description", ""),
                priority=TaskPriority(task_def.get("priority", "normal")),
                dependencies=task_def.get("dependencies", []),
                prerequisites=task_def.get("prerequisites", {})
            )
            workflow_tasks.append(self.tasks[task_id])
        
        workflow = Workflow(
            id=workflow_id,
            name=workflow_name,
            tasks=workflow_tasks,
            status="pending",
            created_at=datetime.now(),
            metadata=metadata or {}
        )
        
        self.workflows[workflow_id] = workflow
        logger.info(f"Submitted workflow {workflow_id}: {workflow_name} with {len(workflow_tasks)} tasks")
        return workflow_id
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a task"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            return False
        
        task.status = TaskStatus.CANCELLED
        
        # Remove from agent if assigned
        if task.assigned_agent and task.assigned_agent in self.agents:
            agent = self.agents[task.assigned_agent]
            agent.current_tasks.discard(task_id)
            if not agent.current_tasks:
                agent.status = "idle"
        
        logger.info(f"Cancelled task {task_id}")
        return True
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a specific task"""
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        return {
            "id": task.id,
            "type": task.type,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "assigned_agent": task.assigned_agent,
            "created_at": task.created_at.isoformat(),
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "result": task.result,
            "error": task.error
        }
    
    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a specific workflow"""
        if workflow_id not in self.workflows:
            return None
        
        workflow = self.workflows[workflow_id]
        task_statuses = [task.status.value for task in workflow.tasks]
        
        # Determine overall workflow status
        if all(status == "completed" for status in task_statuses):
            overall_status = "completed"
        elif any(status == "failed" for status in task_statuses):
            overall_status = "failed"
        elif any(status in ["running", "assigned"] for status in task_statuses):
            overall_status = "running"
        else:
            overall_status = "pending"
        
        return {
            "id": workflow.id,
            "name": workflow.name,
            "status": overall_status,
            "tasks_count": len(workflow.tasks),
            "completed_tasks": task_statuses.count("completed"),
            "failed_tasks": task_statuses.count("failed"),
            "created_at": workflow.created_at.isoformat(),
            "tasks": [{
                "id": task.id,
                "description": task.description,
                "status": task.status.value
            } for task in workflow.tasks]
        }
    
    def get_agent_status(self) -> List[Dict[str, Any]]:
        """Get status of all agents"""
        return [
            {
                "id": agent.id,
                "type": agent.type,
                "status": agent.status,
                "capabilities": list(agent.capabilities),
                "current_tasks": list(agent.current_tasks),
                "max_concurrent_tasks": agent.max_concurrent_tasks,
                "performance_metrics": agent.performance_metrics,
                "last_activity": agent.last_activity.isoformat() if agent.last_activity else None
            }
            for agent in self.agents.values()
        ]
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get overall system metrics"""
        total_tasks = len(self.tasks)
        completed_tasks = len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED])
        failed_tasks = len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED])
        running_tasks = len([t for t in self.tasks.values() if t.status == TaskStatus.RUNNING])
        
        active_agents = len([a for a in self.agents.values() if a.status != "idle"])
        
        return {
            "total_agents": len(self.agents),
            "active_agents": active_agents,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "running_tasks": running_tasks,
            "pending_tasks": total_tasks - completed_tasks - failed_tasks - running_tasks,
            "total_workflows": len(self.workflows),
            "success_rate": completed_tasks / total_tasks if total_tasks > 0 else 0
        }
    
    def add_event_callback(self, event_type: str, callback: Callable[[Dict[str, Any]], None]):
        """Add an event callback"""
        if event_type in self.event_callbacks:
            self.event_callbacks[event_type].append(callback)
    
    async def _coordination_loop(self):
        """Main coordination loop"""
        while True:
            try:
                # Process pending tasks
                await self._process_task_queue()
                
                # Check for completed tasks
                await self._check_task_completion()
                
                # Update workflow statuses
                await self._update_workflow_statuses()
                
                # Balance load across agents
                await self._balance_agent_load()
                
                await asyncio.sleep(1.0)  # Coordination cycle interval
                
            except Exception as e:
                logger.error(f"Error in coordination loop: {e}")
                await asyncio.sleep(5.0)
    
    async def _process_task_queue(self):
        """Process tasks from the queue"""
        try:
            while not self.task_queue.empty():
                task_id = await asyncio.wait_for(self.task_queue.get(), timeout=0.1)
                await self._assign_task(task_id)
        except asyncio.TimeoutError:
            pass  # No tasks in queue
    
    async def _assign_task(self, task_id: str):
        """Assign a task to the most suitable agent"""
        if task_id not in self.tasks:
            return
        
        task = self.tasks[task_id]
        
        # Check if dependencies are satisfied
        if not self._dependencies_satisfied(task):
            # Put back in queue for later
            await self.task_queue.put(task_id)
            return
        
        # Find suitable agent
        suitable_agents = self._find_suitable_agents(task)
        if not suitable_agents:
            # No suitable agent available, put back in queue
            await self.task_queue.put(task_id)
            return
        
        # Select best agent based on load and performance
        best_agent = self._select_best_agent(suitable_agents, task)
        
        # Assign task
        task.assigned_agent = best_agent.id
        task.status = TaskStatus.ASSIGNED
        task.started_at = datetime.now()
        
        best_agent.current_tasks.add(task_id)
        best_agent.status = "busy"
        best_agent.last_activity = datetime.now()
        
        logger.info(f"Assigned task {task_id} to agent {best_agent.id}")
    
    def _dependencies_satisfied(self, task: Task) -> bool:
        """Check if task dependencies are satisfied"""
        for dep_id in task.dependencies:
            if dep_id in self.tasks:
                dep_task = self.tasks[dep_id]
                if dep_task.status != TaskStatus.COMPLETED:
                    return False
            else:
                # Dependency not found
                return False
        return True
    
    def _find_suitable_agents(self, task: Task) -> List[AgentInfo]:
        """Find agents capable of handling the task"""
        suitable_agents = []
        
        required_capability = self._get_required_capability(task.type)
        
        for agent in self.agents.values():
            if (required_capability in agent.capabilities and 
                len(agent.current_tasks) < agent.max_concurrent_tasks):
                suitable_agents.append(agent)
        
        return suitable_agents
    
    def _get_required_capability(self, task_type: str) -> AgentCapability:
        """Map task type to required capability"""
        capability_mapping = {
            "planning": AgentCapability.PLANNING,
            "implementation": AgentCapability.IMPLEMENTATION,
            "verification": AgentCapability.VERIFICATION,
            "review": AgentCapability.REVIEW,
            "research": AgentCapability.RESEARCH,
            "debugging": AgentCapability.DEBUGGING,
            "testing": AgentCapability.TESTING
        }
        return capability_mapping.get(task_type, AgentCapability.IMPLEMENTATION)
    
    def _select_best_agent(self, agents: List[AgentInfo], task: Task) -> AgentInfo:
        """Select the best agent for a task based on load and performance"""
        # Simple scoring based on current load and performance
        best_agent = None
        best_score = float('-inf')
        
        for agent in agents:
            # Load factor (lower is better)
            load_factor = len(agent.current_tasks) / agent.max_concurrent_tasks
            
            # Performance factor (higher is better)
            performance_factor = agent.performance_metrics.get('success_rate', 0.5)
            
            # Simple scoring formula
            score = performance_factor - (load_factor * 0.5)
            
            if score > best_score:
                best_score = score
                best_agent = agent
        
        return best_agent or agents[0]
    
    async def _check_task_completion(self):
        """Check for completed tasks and update statuses"""
        # This would integrate with actual agent execution
        # For now, simulate some task completions
        pass
    
    async def _update_workflow_statuses(self):
        """Update workflow statuses based on task completions"""
        for workflow in self.workflows.values():
            task_statuses = [task.status for task in workflow.tasks]
            
            if all(status == TaskStatus.COMPLETED for status in task_statuses):
                if workflow.status != "completed":
                    workflow.status = "completed"
                    workflow.completed_at = datetime.now()
                    await self._trigger_event("workflow_completed", {"workflow_id": workflow.id})
    
    async def _balance_agent_load(self):
        """Balance load across agents if needed"""
        # Advanced load balancing logic would go here
        pass
    
    async def _performance_monitor(self):
        """Monitor agent performance"""
        while True:
            try:
                for agent in self.agents.values():
                    # Update performance metrics
                    completed_tasks = [
                        task for task in self.completed_tasks.values()
                        if task.assigned_agent == agent.id
                    ]
                    
                    if completed_tasks:
                        success_count = len([t for t in completed_tasks if t.status == TaskStatus.COMPLETED])
                        agent.performance_metrics['success_rate'] = success_count / len(completed_tasks)
                        
                        avg_duration = sum(
                            (t.actual_duration.total_seconds() for t in completed_tasks if t.actual_duration),
                            0
                        ) / len(completed_tasks)
                        agent.performance_metrics['avg_task_duration'] = avg_duration
                
                await asyncio.sleep(60.0)  # Update every minute
                
            except Exception as e:
                logger.error(f"Error in performance monitor: {e}")
                await asyncio.sleep(30.0)
    
    async def _trigger_event(self, event_type: str, data: Dict[str, Any]):
        """Trigger event callbacks"""
        if event_type in self.event_callbacks:
            for callback in self.event_callbacks[event_type]:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Error in event callback: {e}")