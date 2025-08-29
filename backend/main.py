"""
Open-Deep-Coder Backend API

Main FastAPI application for the agentic IDE backend.
Handles LLM integration, agent coordination, and development tools.
"""

import logging
import os
import sys
from contextlib import asynccontextmanager

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from backend.agents import AgentManager
    from backend.api.models import (
        AgentStatus,
        ChatRequest,
        ChatResponse,
        FileContent,
        FileInfo,
        FileOperation,
        LLMModel,
        TaskRequest,
    )
    from backend.integrations.debug import DebugManager
    from backend.integrations.enhanced_coordination import EnhancedAgentCoordinator
    from backend.integrations.llm import LLMManager
    from backend.integrations.lsp_enhanced import LSPManager
    from backend.integrations.mcp import MCPManager
    from backend.integrations.n8n import N8NManager
    from backend.integrations.tool_discovery import ToolDiscoveryManager
except ImportError:
    # Fallback for when running as script
    from agents import AgentManager
    from api.models import (
        AgentStatus,
        ChatRequest,
        ChatResponse,
        FileContent,
        FileInfo,
        FileOperation,
        LLMModel,
        TaskRequest,
    )
    from integrations.debug import DebugManager
    from integrations.enhanced_coordination import EnhancedAgentCoordinator
    from integrations.llm import LLMManager
    from integrations.lsp_enhanced import LSPManager
    from integrations.mcp import MCPManager
    from integrations.n8n import N8NManager
    from integrations.tool_discovery import ToolDiscoveryManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global managers
agent_manager: AgentManager | None = None
llm_manager: LLMManager | None = None
lsp_manager: LSPManager | None = None
mcp_manager: MCPManager | None = None
n8n_manager: N8NManager | None = None
debug_manager: DebugManager | None = None
coordinator: EnhancedAgentCoordinator | None = None
tool_discovery: ToolDiscoveryManager | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global agent_manager, llm_manager, lsp_manager, mcp_manager, n8n_manager, debug_manager, coordinator, tool_discovery

    # Startup
    logger.info("Starting Open-Deep-Coder backend with enhanced capabilities...")

    # Initialize core managers
    llm_manager = LLMManager()
    agent_manager = AgentManager(llm_manager)

    # Initialize enhanced integration managers
    lsp_manager = LSPManager()
    mcp_manager = MCPManager()
    n8n_manager = N8NManager(n8n_url="http://192.168.50.145:5678")
    debug_manager = DebugManager()
    coordinator = EnhancedAgentCoordinator()
    tool_discovery = ToolDiscoveryManager()

    # Start services in order
    await llm_manager.initialize()
    await agent_manager.initialize()
    await lsp_manager.initialize()
    await mcp_manager.initialize()
    await n8n_manager.initialize()
    await debug_manager.initialize()
    await coordinator.initialize()

    # Initialize tool discovery with all integration managers
    integrations = {
        "lsp": lsp_manager,
        "mcp": mcp_manager,
        "n8n": n8n_manager,
        "debug": debug_manager,
    }
    await tool_discovery.initialize(integrations)

    logger.info("Enhanced backend startup complete")

    yield

    # Shutdown
    logger.info("Shutting down Open-Deep-Coder backend...")

    if tool_discovery:
        await tool_discovery.cleanup()
    if coordinator:
        await coordinator.cleanup()
    if debug_manager:
        await debug_manager.cleanup()
    if n8n_manager:
        await n8n_manager.cleanup()
    if mcp_manager:
        await mcp_manager.cleanup()
    if lsp_manager:
        await lsp_manager.cleanup()
    if agent_manager:
        await agent_manager.cleanup()
    if llm_manager:
        await llm_manager.cleanup()

    logger.info("Backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Open-Deep-Coder API",
    description="Agentic IDE with multi-agent coding workflow",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS from environment for safer defaults in production
# Accepts a comma-separated list in ALLOWED_ORIGINS, otherwise falls back
# to the local dev frontend host/port and tauri.
frontend_host = os.getenv("FRONTEND_HOST", "localhost")
frontend_port = os.getenv("FRONTEND_PORT", "1420")
default_origins = [
    f"http://{frontend_host}:{frontend_port}",
    f"http://127.0.0.1:{frontend_port}",
    "tauri://localhost",
]
allowed_env = os.getenv("ALLOWED_ORIGINS")
if allowed_env:
    allow_origins = [o.strip() for o in allowed_env.split(",") if o.strip()]
else:
    allow_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files if present (built by Docker multi-stage build)
frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"
)
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "services": {
            "llm_manager": llm_manager is not None and llm_manager.is_ready(),
            "agent_manager": agent_manager is not None and agent_manager.is_ready(),
            "lsp_manager": lsp_manager is not None and lsp_manager.is_initialized,
            "mcp_manager": mcp_manager is not None and mcp_manager.is_initialized,
            "n8n_manager": n8n_manager is not None and n8n_manager.is_initialized,
            "debug_manager": debug_manager is not None and debug_manager.is_initialized,
            "coordinator": coordinator is not None and coordinator.is_initialized,
            "tool_discovery": tool_discovery is not None
            and tool_discovery.is_initialized,
        },
        "capabilities": {
            "enhanced_lsp": True,
            "mcp_integration": True,
            "n8n_workflows": True,
            "debugging": True,
            "enhanced_coordination": True,
            "tool_discovery": True,
            "git_integration": True,
        },
    }


# LLM endpoints
@app.get("/api/models", response_model=list[LLMModel])
async def get_available_models():
    """Get available LLM models"""
    if not llm_manager:
        raise HTTPException(status_code=500, detail="LLM manager not initialized")

    return await llm_manager.get_available_models()


@app.post("/api/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """Handle chat completion request"""
    if not llm_manager:
        raise HTTPException(status_code=500, detail="LLM manager not initialized")

    try:
        response = await llm_manager.chat_completion(
            messages=request.messages,
            model=request.model,
            stream=request.stream,
            context=request.context,
        )
        return response
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# Agent endpoints
@app.get("/api/agents/status", response_model=list[AgentStatus])
async def get_agent_status():
    """Get status of all agents"""
    if not agent_manager:
        raise HTTPException(status_code=500, detail="Agent manager not initialized")

    return await agent_manager.get_all_status()


@app.post("/api/agents/{agent_type}/run")
async def run_agent(agent_type: str, request: TaskRequest):
    """Run a specific agent with a task"""
    if not agent_manager:
        raise HTTPException(status_code=500, detail="Agent manager not initialized")

    try:
        result = await agent_manager.run_agent(
            agent_type, request.task, request.context
        )
        return {"status": "started", "task_id": result}
    except Exception as e:
        logger.error(f"Error running agent {agent_type}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/agents/{agent_type}/stop")
async def stop_agent(agent_type: str):
    """Stop a specific agent"""
    if not agent_manager:
        raise HTTPException(status_code=500, detail="Agent manager not initialized")

    try:
        await agent_manager.stop_agent(agent_type)
        return {"status": "stopped"}
    except Exception as e:
        logger.error(f"Error stopping agent {agent_type}: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/agents/stop-all")
async def stop_all_agents():
    """Stop all running agents"""
    if not agent_manager:
        raise HTTPException(status_code=500, detail="Agent manager not initialized")

    try:
        await agent_manager.stop_all_agents()
        return {"status": "all_stopped"}
    except Exception as e:
        logger.error(f"Error stopping all agents: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# WebSocket for real-time communication
async def _handle_ws_message(websocket: WebSocket, data: dict) -> None:
    """Handle a single websocket message."""
    message_type = data.get("type")

    if message_type == "ping":
        await websocket.send_json({"type": "pong"})

    elif message_type == "agent_status_request":
        if agent_manager:
            status = await agent_manager.get_all_status()
            await websocket.send_json({"type": "agent_status_update", "data": status})

    elif message_type == "chat_message":
        if llm_manager:
            try:
                response = await llm_manager.chat_completion(
                    messages=data.get("messages", []),
                    model=data.get("model"),
                    stream=True,
                )

                async for chunk in response:
                    await websocket.send_json({"type": "chat_chunk", "data": chunk})

                await websocket.send_json({"type": "chat_complete"})
            except Exception as e:
                await websocket.send_json({"type": "chat_error", "error": str(e)})

    else:
        logger.warning(f"Unknown message type: {message_type}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_json()
            await _handle_ws_message(websocket, data)

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()


# File system endpoints
@app.get("/api/files")
async def list_files(path: str = "."):
    """List files and directories in a path"""
    import os
    from datetime import datetime

    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            raise HTTPException(status_code=404, detail="Path not found")

        items = []
        for item in os.listdir(abs_path):
            item_path = os.path.join(abs_path, item)
            stat = os.stat(item_path)

            items.append(
                FileInfo(
                    path=item_path,
                    name=item,
                    size=stat.st_size,
                    modified=datetime.fromtimestamp(stat.st_mtime),
                    is_directory=os.path.isdir(item_path),
                    permissions=(
                        ["read", "write"] if os.access(item_path, os.W_OK) else ["read"]
                    ),
                )
            )

        return items
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/files/content")
async def get_file_content(path: str):
    """Get file content"""
    import os
    from datetime import datetime

    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path) or os.path.isdir(abs_path):
            raise HTTPException(status_code=404, detail="File not found")

        with open(abs_path, encoding="utf-8") as f:
            content = f.read()

        stat = os.stat(abs_path)

        return FileContent(
            path=abs_path,
            content=content,
            encoding="utf-8",
            modified=datetime.fromtimestamp(stat.st_mtime),
        )
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/files/content")
async def save_file_content(operation: FileOperation):
    """Save file content"""
    import os

    try:
        abs_path = os.path.abspath(operation.path)

        if operation.operation == "write":
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)

            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(operation.content or "")

            return {"status": "success", "path": abs_path}

        elif operation.operation == "delete":
            if os.path.exists(abs_path):
                os.remove(abs_path)
                return {"status": "deleted", "path": abs_path}
            else:
                raise HTTPException(status_code=404, detail="File not found")

        else:
            raise HTTPException(status_code=400, detail="Invalid operation")

    except Exception as e:
        logger.error(f"Error in file operation: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# Enhanced LSP endpoints
@app.get("/api/lsp/servers")
async def get_lsp_servers():
    """Get status of all LSP servers"""
    if not lsp_manager:
        raise HTTPException(status_code=500, detail="LSP manager not initialized")

    return lsp_manager.get_server_status()


@app.post("/api/lsp/completion")
async def get_code_completion(request: dict) -> dict:
    """Get code completion at position"""
    if not lsp_manager:
        raise HTTPException(status_code=500, detail="LSP manager not initialized")

    try:
        completions = await lsp_manager.get_completions(
            request["file_path"], request["position"], request["language"]
        )
        return {"completions": completions}
    except Exception as e:
        logger.error(f"Error getting completions: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/lsp/hover")
async def get_hover_info(request: dict) -> dict:
    """Get hover information at position"""
    if not lsp_manager:
        raise HTTPException(status_code=500, detail="LSP manager not initialized")

    try:
        hover_info = await lsp_manager.get_hover_info(
            request["file_path"], request["position"], request["language"]
        )
        return {"hover_info": hover_info}
    except Exception as e:
        logger.error(f"Error getting hover info: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# MCP endpoints
@app.get("/api/mcp/servers")
async def get_mcp_servers():
    """Get status of all MCP servers"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    return mcp_manager.get_server_status()


@app.get("/api/mcp/tools")
async def get_mcp_tools():
    """Get available MCP tools"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    return mcp_manager.get_available_tools()


@app.post("/api/mcp/invoke")
async def invoke_mcp_tool(request: dict) -> dict:
    """Invoke an MCP tool"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    try:
        result = await mcp_manager.invoke_tool(
            request["server_id"], request["tool_name"], request.get("parameters", {})
        )
        return result
    except Exception as e:
        logger.error(f"Error invoking MCP tool: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# n8n endpoints
@app.get("/api/n8n/workflows")
async def get_n8n_workflows():
    """Get n8n workflow status"""
    if not n8n_manager:
        raise HTTPException(status_code=500, detail="n8n manager not initialized")

    return n8n_manager.get_workflow_status()


@app.post("/api/n8n/execute")
async def execute_n8n_workflow(request: dict) -> dict:
    """Execute an n8n workflow"""
    if not n8n_manager:
        raise HTTPException(status_code=500, detail="n8n manager not initialized")

    try:
        execution_id = await n8n_manager.execute_workflow(
            request["workflow_id"], request.get("data", {})
        )
        return (
            {"execution_id": execution_id}
            if execution_id
            else {"error": "Failed to start workflow"}
        )
    except Exception as e:
        logger.error(f"Error executing n8n workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/n8n/git/commit")
async def trigger_git_commit_workflow(request: dict) -> dict:
    """Trigger git commit workflow via n8n"""
    if not n8n_manager:
        raise HTTPException(status_code=500, detail="n8n manager not initialized")

    try:
        execution_id = await n8n_manager.trigger_git_commit_workflow(
            request["repository_path"], request["commit_message"], request["files"]
        )
        return (
            {"execution_id": execution_id}
            if execution_id
            else {"error": "Failed to trigger workflow"}
        )
    except Exception as e:
        logger.error(f"Error triggering git commit workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# Debug endpoints
@app.get("/api/debug/sessions")
async def get_debug_sessions():
    """Get status of all debug sessions"""
    if not debug_manager:
        raise HTTPException(status_code=500, detail="Debug manager not initialized")

    return debug_manager.get_session_status()


@app.post("/api/debug/start")
async def start_debug_session(request: dict):
    """Start a debug session"""
    if not debug_manager:
        raise HTTPException(status_code=500, detail="Debug manager not initialized")

    try:
        session_id = await debug_manager.start_debug_session(
            request["file_path"], request["language"], request.get("config")
        )
        return (
            {"session_id": session_id}
            if session_id
            else {"error": "Failed to start debug session"}
        )
    except Exception as e:
        logger.error(f"Error starting debug session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/debug/breakpoint")
async def set_breakpoint(request: dict):
    """Set a breakpoint"""
    if not debug_manager:
        raise HTTPException(status_code=500, detail="Debug manager not initialized")

    try:
        breakpoint_id = await debug_manager.set_breakpoint(
            request["session_id"],
            request["file_path"],
            request["line"],
            request.get("condition"),
        )
        return (
            {"breakpoint_id": breakpoint_id}
            if breakpoint_id
            else {"error": "Failed to set breakpoint"}
        )
    except Exception as e:
        logger.error(f"Error setting breakpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Tool Discovery endpoints
@app.get("/api/tools")
async def get_available_tools(category: str = None):
    """Get all available tools"""
    if not tool_discovery:
        raise HTTPException(status_code=500, detail="Tool discovery not initialized")

    return tool_discovery.get_available_tools(category=category)


@app.post("/api/tools/invoke")
async def invoke_tool(request: dict):
    """Invoke a tool capability"""
    if not tool_discovery:
        raise HTTPException(status_code=500, detail="Tool discovery not initialized")

    try:
        result = await tool_discovery.invoke_tool(
            request["tool_id"], request["capability"], request.get("parameters", {})
        )
        return result
    except Exception as e:
        logger.error(f"Error invoking tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tools/analytics")
async def get_tool_analytics():
    """Get tool usage analytics"""
    if not tool_discovery:
        raise HTTPException(status_code=500, detail="Tool discovery not initialized")

    return tool_discovery.get_usage_analytics()


# Enhanced coordination endpoints
@app.get("/api/coordination/status")
async def get_coordination_status():
    """Get enhanced coordination system status"""
    if not coordinator:
        raise HTTPException(status_code=500, detail="Coordinator not initialized")

    return {
        "agents": coordinator.get_agent_status(),
        "metrics": coordinator.get_system_metrics(),
    }


@app.post("/api/coordination/task")
async def submit_coordination_task(request: dict):
    """Submit a task to the coordination system"""
    if not coordinator:
        raise HTTPException(status_code=500, detail="Coordinator not initialized")

    try:
        from backend.integrations.enhanced_coordination import TaskPriority

        task_id = await coordinator.submit_task(
            request["type"],
            request["description"],
            TaskPriority(request.get("priority", "normal")),
            request.get("dependencies"),
            request.get("prerequisites"),
        )
        return {"task_id": task_id}
    except Exception as e:
        logger.error(f"Error submitting coordination task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/coordination/workflow")
async def submit_coordination_workflow(request: dict):
    """Submit a workflow to the coordination system"""
    if not coordinator:
        raise HTTPException(status_code=500, detail="Coordinator not initialized")

    try:
        workflow_id = await coordinator.submit_workflow(
            request["name"], request["tasks"], request.get("metadata")
        )
        return {"workflow_id": workflow_id}
    except Exception as e:
        logger.error(f"Error submitting coordination workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Git Integration endpoints (via MCP and n8n)
@app.get("/api/git/status")
async def git_status(repository_path: str = "."):
    """Get git status using MCP"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    try:
        result = await mcp_manager.git_status(repository_path)
        return result
    except Exception as e:
        logger.error(f"Error getting git status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/commit")
async def git_commit(request: dict):
    """Commit changes using MCP or n8n"""
    repository_path = request.get("repository_path", ".")
    commit_message = request["commit_message"]
    files = request.get("files")
    use_n8n = request.get("use_n8n", False)

    try:
        if use_n8n and n8n_manager:
            # Use n8n workflow for git operations
            execution_id = await n8n_manager.trigger_git_commit_workflow(
                repository_path, commit_message, files or []
            )
            return {
                "method": "n8n",
                "execution_id": execution_id,
                "status": "workflow_started" if execution_id else "failed",
            }
        elif mcp_manager:
            # Use MCP for direct git operations
            result = await mcp_manager.git_commit(
                repository_path, commit_message, files
            )
            return {
                "method": "mcp",
                "result": result,
                "status": "completed" if "error" not in result else "failed",
            }
        else:
            raise HTTPException(status_code=500, detail="No git integration available")
    except Exception as e:
        logger.error(f"Error in git commit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/push")
async def git_push(request: dict):
    """Push changes using MCP"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    try:
        result = await mcp_manager.git_push(
            request.get("repository_path", "."),
            request.get("remote", "origin"),
            request.get("branch", "main"),
        )
        return result
    except Exception as e:
        logger.error(f"Error in git push: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/pull")
async def git_pull(request: dict):
    """Pull changes using MCP"""
    if not mcp_manager:
        raise HTTPException(status_code=500, detail="MCP manager not initialized")

    try:
        result = await mcp_manager.git_pull(
            request.get("repository_path", "."),
            request.get("remote", "origin"),
            request.get("branch", "main"),
        )
        return result
    except Exception as e:
        logger.error(f"Error in git pull: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/git/setup-automation")
async def setup_git_automation(request: dict):
    """Setup automated git workflows using n8n"""
    if not n8n_manager:
        raise HTTPException(status_code=500, detail="n8n manager not initialized")

    try:
        workflow_id = await n8n_manager.setup_git_integration_workflow(
            request["repository_path"]
        )
        return {
            "workflow_id": workflow_id,
            "status": "automation_setup" if workflow_id else "failed",
        }
    except Exception as e:
        logger.error(f"Error setting up git automation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Development and testing endpoints
@app.get("/api/dev/test-llm")
async def test_llm():
    """Test LLM integration"""
    if not llm_manager:
        raise HTTPException(status_code=500, detail="LLM manager not initialized")

    try:
        test_messages = [
            {
                "role": "user",
                "content": "Hello! This is a test message. Please respond briefly.",
            }
        ]
        response = await llm_manager.chat_completion(test_messages)
        return {
            "status": "success",
            "model_used": response.model,
            "response": response.message.content,
            "tokens": response.tokens,
        }
    except Exception as e:
        logger.error(f"LLM test error: {e}")
        return {"status": "error", "error": str(e)}


@app.get("/api/dev/test-integrations")
async def test_integrations():
    """Test all integrations"""
    results = {}

    # Test LSP
    if lsp_manager and lsp_manager.is_initialized:
        servers = lsp_manager.get_server_status()
        results["lsp"] = {
            "status": "available",
            "servers_count": len(servers),
            "active_servers": len([s for s in servers if s["state"] == "running"]),
        }
    else:
        results["lsp"] = {"status": "unavailable"}

    # Test MCP
    if mcp_manager and mcp_manager.is_initialized:
        server_status = mcp_manager.get_server_status()
        results["mcp"] = {
            "status": "available",
            "servers_count": len(server_status),
            "connected_servers": len(
                [s for s in server_status if s["state"] == "connected"]
            ),
        }
    else:
        results["mcp"] = {"status": "unavailable"}

    # Test n8n
    if n8n_manager and n8n_manager.is_initialized:
        workflows = n8n_manager.get_workflow_status()
        results["n8n"] = {
            "status": "available",
            "workflows_count": len(workflows),
            "active_workflows": len([w for w in workflows if w["status"] == "active"]),
        }
    else:
        results["n8n"] = {"status": "unavailable"}

    # Test Debug
    if debug_manager and debug_manager.is_initialized:
        sessions = debug_manager.get_session_status()
        results["debug"] = {"status": "available", "sessions_count": len(sessions)}
    else:
        results["debug"] = {"status": "unavailable"}

    # Test Tool Discovery
    if tool_discovery and tool_discovery.is_initialized:
        tools = tool_discovery.get_available_tools()
        analytics = tool_discovery.get_usage_analytics()
        results["tool_discovery"] = {
            "status": "available",
            "tools_count": len(tools),
            "categories": analytics["by_category"],
        }
    else:
        results["tool_discovery"] = {"status": "unavailable"}

    # Test Coordination
    if coordinator and coordinator.is_initialized:
        status = coordinator.get_agent_status()
        metrics = coordinator.get_system_metrics()
        results["coordination"] = {
            "status": "available",
            "agents_count": len(status),
            "metrics": metrics,
        }
    else:
        results["coordination"] = {"status": "unavailable"}

    return results


# Main entry point
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app", host="127.0.0.1", port=8000, reload=True, log_level="info"
    )
