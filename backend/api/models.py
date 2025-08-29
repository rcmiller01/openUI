"""
API Models for Open-Deep-Coder

Pydantic models for request/response validation and documentation.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# Chat Models
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime | None = None
    model: str | None = None
    tokens: int | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str | None = None
    stream: bool = False
    context: dict[str, Any] | None = None
    max_tokens: int | None = None
    temperature: float | None = None


class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    tokens: int
    finish_reason: str
    context: dict[str, Any] | None = None


# LLM Models
class LLMModel(BaseModel):
    id: str
    name: str
    provider: Literal["openrouter", "ollama", "local"]
    capabilities: list[str]
    context_length: int
    is_available: bool
    description: str | None = None
    pricing: dict[str, float] | None = None


# Agent Models
class AgentStatus(BaseModel):
    type: Literal[
        "orchestrator", "planner", "implementer", "verifier", "reviewer", "researcher"
    ]
    status: Literal["idle", "running", "success", "error", "paused"]
    current_task: str | None = None
    progress: float | None = Field(None, ge=0.0, le=1.0)
    last_result: dict[str, Any] | None = None
    error: str | None = None
    started_at: datetime | None = None
    updated_at: datetime | None = None


class TaskRequest(BaseModel):
    task: str
    context: dict[str, Any] | None = None
    priority: int | None = Field(1, ge=1, le=5)
    timeout: int | None = Field(None, gt=0)  # seconds


class TaskResult(BaseModel):
    task_id: str
    agent_type: str
    status: str
    result: dict[str, Any] | None = None
    error: str | None = None
    execution_time: float | None = None
    created_at: datetime
    completed_at: datetime | None = None


# File System Models
class FileInfo(BaseModel):
    path: str
    name: str
    size: int
    modified: datetime
    is_directory: bool
    permissions: list[str]


class FileContent(BaseModel):
    path: str
    content: str
    encoding: str = "utf-8"
    modified: datetime


class FileOperation(BaseModel):
    operation: Literal["read", "write", "delete", "create", "move", "copy"]
    path: str
    content: str | None = None
    destination: str | None = None


# LSP Models
class LSPServer(BaseModel):
    id: str
    language: str
    command: list[str]
    args: list[str]
    status: Literal["stopped", "starting", "running", "error"]
    capabilities: dict[str, Any]


class LSPRequest(BaseModel):
    method: str
    params: dict[str, Any]
    file_path: str | None = None


class CompletionRequest(BaseModel):
    file_path: str
    position: dict[str, int]  # line, character
    context: str | None = None


class CompletionItem(BaseModel):
    label: str
    kind: int
    detail: str | None = None
    documentation: str | None = None
    insert_text: str | None = None


# MCP Models
class MCPServer(BaseModel):
    id: str
    name: str
    url: str
    status: Literal["disconnected", "connecting", "connected", "error"]
    capabilities: list[str]
    tools: list[str]


class MCPToolRequest(BaseModel):
    server_id: str
    tool_name: str
    parameters: dict[str, Any]


class MCPToolResult(BaseModel):
    success: bool
    result: dict[str, Any] | None = None
    error: str | None = None


# n8n Models
class N8NWorkflow(BaseModel):
    id: str
    name: str
    active: bool
    nodes: list[dict[str, Any]]
    connections: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class N8NExecution(BaseModel):
    id: str
    workflow_id: str
    status: Literal["new", "running", "success", "error", "canceled"]
    data: dict[str, Any]
    started_at: datetime
    finished_at: datetime | None = None


# Permission Models
class PermissionRequest(BaseModel):
    resource: str
    action: str
    reason: str | None = None
    temporary: bool = False
    duration: int | None = None  # seconds


class Permission(BaseModel):
    resource: str
    action: str
    granted: bool
    granted_at: datetime | None = None
    expires_at: datetime | None = None
    reason: str | None = None


# Theme Models
class ThemeConfig(BaseModel):
    variant: Literal["light-low", "light-high", "dark-low", "dark-high"]
    custom_colors: dict[str, str] | None = None


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
    context: str | None = None
    description: str | None = None


class AppSettings(BaseModel):
    editor: EditorSettings
    theme: ThemeConfig
    keybinds: list[KeybindConfig]
    llm_settings: dict[str, Any]
    permissions: list[Permission]


# WebSocket Models
class WebSocketMessage(BaseModel):
    type: str
    data: dict[str, Any] | None = None
    timestamp: datetime = Field(default_factory=datetime.now)


# Error Models
class APIError(BaseModel):
    error: str
    detail: str | None = None
    code: str | None = None
    timestamp: datetime = Field(default_factory=datetime.now)
