"""
API Models for Open-Deep-Coder

Pydantic models for request/response validation and documentation.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Chat Models
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None
    model: Optional[str] = None
    tokens: Optional[int] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    stream: bool = False
    context: Optional[Dict[str, Any]] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    tokens: int
    finish_reason: str
    context: Optional[Dict[str, Any]] = None

# LLM Models
class LLMModel(BaseModel):
    id: str
    name: str
    provider: Literal["openrouter", "ollama", "local"]
    capabilities: List[str]
    context_length: int
    is_available: bool
    description: Optional[str] = None
    pricing: Optional[Dict[str, float]] = None

# Agent Models
class AgentStatus(BaseModel):
    type: Literal["orchestrator", "planner", "implementer", "verifier", "reviewer", "researcher"]
    status: Literal["idle", "running", "success", "error", "paused"]
    current_task: Optional[str] = None
    progress: Optional[float] = Field(None, ge=0.0, le=1.0)
    last_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TaskRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = None
    priority: Optional[int] = Field(1, ge=1, le=5)
    timeout: Optional[int] = Field(None, gt=0)  # seconds

class TaskResult(BaseModel):
    task_id: str
    agent_type: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

# File System Models
class FileInfo(BaseModel):
    path: str
    name: str
    size: int
    modified: datetime
    is_directory: bool
    permissions: List[str]

class FileContent(BaseModel):
    path: str
    content: str
    encoding: str = "utf-8"
    modified: datetime

class FileOperation(BaseModel):
    operation: Literal["read", "write", "delete", "create", "move", "copy"]
    path: str
    content: Optional[str] = None
    destination: Optional[str] = None

# LSP Models
class LSPServer(BaseModel):
    id: str
    language: str
    command: List[str]
    args: List[str]
    status: Literal["stopped", "starting", "running", "error"]
    capabilities: Dict[str, Any]

class LSPRequest(BaseModel):
    method: str
    params: Dict[str, Any]
    file_path: Optional[str] = None

class CompletionRequest(BaseModel):
    file_path: str
    position: Dict[str, int]  # line, character
    context: Optional[str] = None

class CompletionItem(BaseModel):
    label: str
    kind: int
    detail: Optional[str] = None
    documentation: Optional[str] = None
    insert_text: Optional[str] = None

# MCP Models
class MCPServer(BaseModel):
    id: str
    name: str
    url: str
    status: Literal["disconnected", "connecting", "connected", "error"]
    capabilities: List[str]
    tools: List[str]

class MCPToolRequest(BaseModel):
    server_id: str
    tool_name: str
    parameters: Dict[str, Any]

class MCPToolResult(BaseModel):
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# n8n Models
class N8NWorkflow(BaseModel):
    id: str
    name: str
    active: bool
    nodes: List[Dict[str, Any]]
    connections: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class N8NExecution(BaseModel):
    id: str
    workflow_id: str
    status: Literal["new", "running", "success", "error", "canceled"]
    data: Dict[str, Any]
    started_at: datetime
    finished_at: Optional[datetime] = None

# Permission Models
class PermissionRequest(BaseModel):
    resource: str
    action: str
    reason: Optional[str] = None
    temporary: bool = False
    duration: Optional[int] = None  # seconds

class Permission(BaseModel):
    resource: str
    action: str
    granted: bool
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    reason: Optional[str] = None

# Theme Models
class ThemeConfig(BaseModel):
    variant: Literal["light-low", "light-high", "dark-low", "dark-high"]
    custom_colors: Optional[Dict[str, str]] = None

# Settings Models
class EditorSettings(BaseModel):
    font_size: int = Field(14, ge=8, le=32)
    tab_size: int = Field(2, ge=1, le=8)
    word_wrap: bool = True
    line_numbers: bool = True
    minimap: bool = True
    auto_save: bool = True
    auto_save_delay: int = Field(1000, ge=100, le=10000)  # milliseconds

class KeybindConfig(BaseModel):
    action: str
    key_combination: str
    context: Optional[str] = None
    description: Optional[str] = None

class AppSettings(BaseModel):
    editor: EditorSettings
    theme: ThemeConfig
    keybinds: List[KeybindConfig]
    llm_settings: Dict[str, Any]
    permissions: List[Permission]

# WebSocket Models
class WebSocketMessage(BaseModel):
    type: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Error Models
class APIError(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)