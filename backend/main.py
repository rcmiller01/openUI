"""
Open-Deep-Coder Backend API

Main FastAPI application for the agentic IDE backend.
Handles LLM integration, agent coordination, and development tools.
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

try:
    from backend.agents import AgentManager
    from backend.integrations.llm import LLMManager
    from backend.integrations.lsp import LSPManager
    from backend.integrations.mcp import MCPManager
    from backend.integrations.n8n import N8NManager
    from backend.api.models import (
        ChatMessage, 
        ChatRequest, 
        ChatResponse,
        AgentStatus,
        LLMModel,
        TaskRequest,
        FileInfo,
        FileContent,
        FileOperation,
    )
except ImportError:
    # Fallback for when running as script
    from agents import AgentManager
    from integrations.llm import LLMManager
    from integrations.lsp import LSPManager
    from integrations.mcp import MCPManager
    from integrations.n8n import N8NManager
    from api.models import (
        ChatMessage, 
        ChatRequest, 
        ChatResponse,
        AgentStatus,
        LLMModel,
        TaskRequest,
        FileInfo,
        FileContent,
        FileOperation,
    )

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global managers
agent_manager: Optional[AgentManager] = None
llm_manager: Optional[LLMManager] = None
lsp_manager: Optional[LSPManager] = None
mcp_manager: Optional[MCPManager] = None
n8n_manager: Optional[N8NManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global agent_manager, llm_manager, lsp_manager, mcp_manager, n8n_manager
    
    # Startup
    logger.info("Starting Open-Deep-Coder backend...")
    
    # Initialize managers
    llm_manager = LLMManager()
    agent_manager = AgentManager(llm_manager)
    lsp_manager = LSPManager()
    mcp_manager = MCPManager()
    n8n_manager = N8NManager()
    
    # Start services
    await llm_manager.initialize()
    await agent_manager.initialize()
    
    logger.info("Backend startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Open-Deep-Coder backend...")
    
    if agent_manager:
        await agent_manager.cleanup()
    if llm_manager:
        await llm_manager.cleanup()
    if lsp_manager:
        await lsp_manager.cleanup()
    if mcp_manager:
        await mcp_manager.cleanup()
    if n8n_manager:
        await n8n_manager.cleanup()
    
    logger.info("Backend shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Open-Deep-Coder API",
    description="Agentic IDE with multi-agent coding workflow",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "lsp_manager": lsp_manager is not None,
            "mcp_manager": mcp_manager is not None,
            "n8n_manager": n8n_manager is not None,
        }
    }

# LLM endpoints
@app.get("/api/models", response_model=List[LLMModel])
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
            context=request.context
        )
        return response
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent endpoints
@app.get("/api/agents/status", response_model=List[AgentStatus])
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
        result = await agent_manager.run_agent(agent_type, request.task, request.context)
        return {"status": "started", "task_id": result}
    except Exception as e:
        logger.error(f"Error running agent {agent_type}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif message_type == "agent_status_request":
                if agent_manager:
                    status = await agent_manager.get_all_status()
                    await websocket.send_json({
                        "type": "agent_status_update",
                        "data": status
                    })
            
            elif message_type == "chat_message":
                if llm_manager:
                    try:
                        response = await llm_manager.chat_completion(
                            messages=data.get("messages", []),
                            model=data.get("model"),
                            stream=True
                        )
                        
                        # Stream response
                        async for chunk in response:
                            await websocket.send_json({
                                "type": "chat_chunk",
                                "data": chunk
                            })
                        
                        await websocket.send_json({
                            "type": "chat_complete"
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "chat_error",
                            "error": str(e)
                        })
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
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
            
            items.append(FileInfo(
                path=item_path,
                name=item,
                size=stat.st_size,
                modified=datetime.fromtimestamp(stat.st_mtime),
                is_directory=os.path.isdir(item_path),
                permissions=["read", "write"] if os.access(item_path, os.W_OK) else ["read"]
            ))
        
        return items
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/content")
async def get_file_content(path: str):
    """Get file content"""
    import os
    from datetime import datetime
    
    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path) or os.path.isdir(abs_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        stat = os.stat(abs_path)
        
        return FileContent(
            path=abs_path,
            content=content,
            encoding="utf-8",
            modified=datetime.fromtimestamp(stat.st_mtime)
        )
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/content")
async def save_file_content(operation: FileOperation):
    """Save file content"""
    import os
    
    try:
        abs_path = os.path.abspath(operation.path)
        
        if operation.operation == "write":
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            
            with open(abs_path, 'w', encoding='utf-8') as f:
                f.write(operation.content or "")
            
            return {"status": "success", "path": abs_path}
        
        elif operation.operation == "delete":
            if os.path.exists(abs_path):
                os.remove(abs_path)
            return {"status": "success", "path": abs_path}
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {operation.operation}")
            
    except Exception as e:
        logger.error(f"Error with file operation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Development endpoints (for testing)
@app.get("/api/dev/test-llm")
async def test_llm():
    """Test LLM connection"""
    if not llm_manager:
        raise HTTPException(status_code=500, detail="LLM manager not initialized")
    
    try:
        test_message = ChatMessage(role="user", content="Hello, are you working?")
        response = await llm_manager.chat_completion(
            messages=[test_message],
            model=None  # Use default model
        )
        return {"status": "success", "response": response}
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )