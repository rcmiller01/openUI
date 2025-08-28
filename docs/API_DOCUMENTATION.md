# Open-Deep-Coder API Documentation

This document provides comprehensive documentation for all API endpoints available in Open-Deep-Coder, including core services and all enhanced integration capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [LLM Integration Endpoints](#llm-integration-endpoints)
5. [LSP Integration Endpoints](#lsp-integration-endpoints)
6. [MCP Integration Endpoints](#mcp-integration-endpoints)
7. [n8n Integration Endpoints](#n8n-integration-endpoints)
8. [Debugging Endpoints](#debugging-endpoints)
9. [Git Integration Endpoints](#git-integration-endpoints)
10. [Agent Coordination Endpoints](#agent-coordination-endpoints)
11. [Tool Discovery Endpoints](#tool-discovery-endpoints)
12. [Development Endpoints](#development-endpoints)
13. [WebSocket Interface](#websocket-interface)

## Overview

Open-Deep-Coder provides a comprehensive REST API for accessing all integrated development tools and services. The API follows standard REST conventions and returns JSON responses.

Base URL: `http://127.0.0.1:8000/api/`

## Authentication

Most endpoints do not require authentication as they operate on local resources. However, some endpoints that interact with external services may require API keys:

- OpenRouter API key for remote LLM access
- n8n server authentication (if configured)

API keys should be provided in the request headers:
```
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### Health Check
```
GET /health
```
Returns the overall health status of the system.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### Get Available Models
```
GET /api/models
```
Returns a list of available LLM models from all providers.

**Response:**
```json
{
  "ollama": ["llama2", "codellama", "mistral"],
  "openrouter": ["openai/gpt-3.5-turbo", "anthropic/claude-2", "google/palm-2-codechat-bison"]
}
```

### Chat Completion
```
POST /api/chat/completion
```
Get a chat completion from the selected LLM.

**Request Body:**
```json
{
  "model": "llama2",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "provider": "ollama"
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "llama2",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking!"
      },
      "finish_reason": "stop"
    }
  ]
}
```

## LSP Integration Endpoints

### Get LSP Servers
```
GET /api/lsp/servers
```
Get the status of all configured LSP servers.

**Response:**
```json
{
  "python": {
    "name": "Pylsp",
    "status": "running",
    "version": "1.7.5"
  },
  "typescript": {
    "name": "TypeScript Language Server",
    "status": "stopped",
    "error": null
  }
}
```

### Get Code Completion
```
POST /api/lsp/completion
```
Get code completion suggestions from the LSP server.

**Request Body:**
```json
{
  "filePath": "/path/to/file.py",
  "position": {
    "line": 10,
    "character": 5
  },
  "language": "python"
}
```

**Response:**
```json
{
  "completions": [
    {
      "label": "print",
      "kind": "Function",
      "detail": "print(*values, sep=' ', end='\\n', file=sys.stdout, flush=False)",
      "documentation": "Prints the values to a stream, or to sys.stdout by default."
    }
  ]
}
```

### Get Hover Information
```
POST /api/lsp/hover
```
Get hover information for a specific position in a file.

**Request Body:**
```json
{
  "filePath": "/path/to/file.py",
  "position": {
    "line": 15,
    "character": 10
  },
  "language": "python"
}
```

**Response:**
```json
{
  "contents": [
    {
      "language": "python",
      "value": "def calculate_sum(a: int, b: int) -> int"
    },
    "Calculates the sum of two integers."
  ]
}
```

### Get Diagnostics
```
POST /api/lsp/diagnostics
```
Get diagnostics (errors, warnings) for a file.

**Request Body:**
```json
{
  "filePath": "/path/to/file.py",
  "language": "python"
}
```

**Response:**
```json
{
  "diagnostics": [
    {
      "range": {
        "start": {"line": 10, "character": 5},
        "end": {"line": 10, "character": 10}
      },
      "severity": "Error",
      "message": "Undefined variable 'x'",
      "source": "pylsp"
    }
  ]
}
```

## MCP Integration Endpoints

### Get MCP Servers
```
GET /api/mcp/servers
```
Get the status of all configured MCP servers.

**Response:**
```json
{
  "git_mcp": {
    "name": "Git MCP Server",
    "status": "running",
    "version": "1.0.0"
  },
  "filesystem_mcp": {
    "name": "Filesystem MCP Server",
    "status": "running",
    "version": "1.0.0"
  }
}
```

### Connect to MCP Server
```
POST /api/mcp/connect
```
Connect to an MCP server.

**Request Body:**
```json
{
  "serverId": "git_mcp",
  "config": {
    "command": ["npx", "@modelcontextprotocol/server-git"]
  }
}
```

**Response:**
```json
{
  "status": "connected",
  "serverId": "git_mcp"
}
```

### Get MCP Tools
```
GET /api/mcp/tools
```
Get available tools from all connected MCP servers.

**Response:**
```json
{
  "git_mcp": [
    {
      "name": "git_status",
      "description": "Get the status of a Git repository",
      "parameters": {
        "type": "object",
        "properties": {
          "repositoryPath": {
            "type": "string",
            "description": "Path to the Git repository"
          }
        }
      }
    }
  ]
}
```

### Invoke MCP Tool
```
POST /api/mcp/invoke
```
Invoke a tool provided by an MCP server.

**Request Body:**
```json
{
  "serverId": "git_mcp",
  "toolName": "git_status",
  "parameters": {
    "repositoryPath": "."
  }
}
```

**Response:**
```json
{
  "result": {
    "status": "success",
    "data": {
      "modified": ["src/main.py"],
      "staged": [],
      "untracked": ["docs/new_doc.md"]
    }
  }
}
```

## n8n Integration Endpoints

### Get n8n Workflows
```
GET /api/n8n/workflows
```
Get available workflows from the n8n server.

**Response:**
```json
[
  {
    "id": "workflow_1",
    "name": "Git Commit Automation",
    "description": "Automatically commit changes to Git",
    "status": "active",
    "lastExecuted": "2023-08-15T10:30:00Z"
  }
]
```

### Execute n8n Workflow
```
POST /api/n8n/execute
```
Execute a workflow on the n8n server.

**Request Body:**
```json
{
  "workflowId": "workflow_1",
  "data": {
    "repositoryPath": ".",
    "commitMessage": "Automated commit"
  }
}
```

**Response:**
```json
{
  "executionId": "exec_123",
  "status": "running",
  "workflowId": "workflow_1"
}
```

### Trigger Git Commit Workflow
```
POST /api/n8n/git/commit
```
Trigger the predefined Git commit workflow.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "commitMessage": "Update documentation",
  "files": ["docs/API_DOCUMENTATION.md"]
}
```

**Response:**
```json
{
  "executionId": "exec_456",
  "status": "triggered",
  "workflowId": "git_commit_workflow"
}
```

### Setup Git Automation
```
POST /api/n8n/setup-automation
```
Setup automated Git workflows.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "workflowType": "daily_commit"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Daily commit workflow setup complete"
}
```

## Debugging Endpoints

### Get Debug Sessions
```
GET /api/debug/sessions
```
Get the status of all debug sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "debug_1",
      "language": "python",
      "status": "running",
      "filePath": "/path/to/script.py"
    }
  ]
}
```

### Start Debug Session
```
POST /api/debug/start
```
Start a new debug session.

**Request Body:**
```json
{
  "filePath": "/path/to/script.py",
  "language": "python",
  "breakpoints": [
    {"line": 10, "condition": null},
    {"line": 25, "condition": "x > 5"}
  ]
}
```

**Response:**
```json
{
  "sessionId": "debug_1",
  "status": "started"
}
```

### Stop Debug Session
```
POST /api/debug/stop
```
Stop a debug session.

**Request Body:**
```json
{
  "sessionId": "debug_1"
}
```

**Response:**
```json
{
  "status": "stopped",
  "sessionId": "debug_1"
}
```

### Set Breakpoint
```
POST /api/debug/breakpoint
```
Set a breakpoint in a debug session.

**Request Body:**
```json
{
  "sessionId": "debug_1",
  "line": 15,
  "condition": "variable_name == 'value'"
}
```

**Response:**
```json
{
  "status": "set",
  "line": 15
}
```

### Continue Execution
```
POST /api/debug/continue
```
Continue execution in a debug session.

**Request Body:**
```json
{
  "sessionId": "debug_1"
}
```

**Response:**
```json
{
  "status": "running",
  "sessionId": "debug_1"
}
```

### Step Execution
```
POST /api/debug/step
```
Step through execution in a debug session.

**Request Body:**
```json
{
  "sessionId": "debug_1",
  "type": "over"  // "over", "into", or "out"
}
```

**Response:**
```json
{
  "status": "stepped",
  "sessionId": "debug_1"
}
```

### Get Variables
```
GET /api/debug/variables
```
Get variable values in the current debug context.

**Query Parameters:**
- `sessionId` (required): The debug session ID

**Response:**
```json
{
  "variables": [
    {
      "name": "x",
      "value": "10",
      "type": "int"
    },
    {
      "name": "name",
      "value": "Open-Deep-Coder",
      "type": "str"
    }
  ]
}
```

### Get Stack Trace
```
GET /api/debug/stack
```
Get the current stack trace.

**Query Parameters:**
- `sessionId` (required): The debug session ID

**Response:**
```json
{
  "stack": [
    {
      "frameId": 1,
      "name": "main",
      "line": 25,
      "file": "/path/to/script.py"
    },
    {
      "frameId": 2,
      "name": "calculate",
      "line": 10,
      "file": "/path/to/utils.py"
    }
  ]
}
```

## Git Integration Endpoints

### Get Git Status
```
GET /api/git/status
```
Get the status of a Git repository.

**Query Parameters:**
- `repositoryPath` (optional): Path to the repository (default: current directory)

**Response:**
```json
{
  "status": "success",
  "data": {
    "branch": "main",
    "modified": ["src/main.py"],
    "staged": [],
    "untracked": ["docs/new_doc.md"],
    "ahead": 0,
    "behind": 0
  }
}
```

### Commit Changes
```
POST /api/git/commit
```
Commit changes to a Git repository.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "message": "Add new feature",
  "files": ["src/main.py", "docs/new_doc.md"],
  "method": "mcp"  // "mcp" or "n8n"
}
```

**Response:**
```json
{
  "status": "success",
  "commitId": "a1b2c3d4e5f"
}
```

### Push Changes
```
POST /api/git/push
```
Push changes to a remote repository.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "remote": "origin",
  "branch": "main"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pushed to origin/main"
}
```

### Pull Changes
```
POST /api/git/pull
```
Pull changes from a remote repository.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "remote": "origin",
  "branch": "main"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pulled from origin/main"
}
```

### Create/Branch Switch
```
POST /api/git/branch
```
Create or switch branches.

**Request Body:**
```json
{
  "repositoryPath": ".",
  "action": "create",  // "create" or "switch"
  "branchName": "feature/new-feature"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Created branch feature/new-feature"
}
```

## Agent Coordination Endpoints

### Get Coordination Status
```
GET /api/coordination/status
```
Get the status of the agent coordination system.

**Response:**
```json
{
  "status": "running",
  "agents": {
    "orchestrator": "idle",
    "planner": "idle",
    "implementer": "running",
    "verifier": "idle",
    "reviewer": "idle",
    "researcher": "idle"
  },
  "taskQueue": 3,
  "activeTasks": 1
}
```

### Submit Task
```
POST /api/coordination/task
```
Submit a task to the agent coordination system.

**Request Body:**
```json
{
  "task": "Implement a function to calculate Fibonacci numbers",
  "priority": "normal",  // "low", "normal", "high", "critical"
  "requiredAgents": ["planner", "implementer", "verifier"]
}
```

**Response:**
```json
{
  "taskId": "task_123",
  "status": "queued"
}
```

### Submit Workflow
```
POST /api/coordination/workflow
```
Submit a workflow to the agent coordination system.

**Request Body:**
```json
{
  "workflow": "code_review",
  "parameters": {
    "filePath": "/path/to/file.py",
    "reviewType": "security"
  }
}
```

**Response:**
```json
{
  "workflowId": "wf_456",
  "status": "started"
}
```

### Get Agent Status
```
GET /api/coordination/agents
```
Get detailed status information for all agents.

**Response:**
```json
{
  "orchestrator": {
    "status": "idle",
    "currentTask": null,
    "lastResult": null
  },
  "planner": {
    "status": "idle",
    "currentTask": null,
    "lastResult": {
      "taskId": "task_122",
      "status": "completed",
      "result": "Plan created successfully"
    }
  }
}
```

### Pause Coordination
```
POST /api/coordination/pause
```
Pause the agent coordination system.

**Response:**
```json
{
  "status": "paused"
}
```

### Resume Coordination
```
POST /api/coordination/resume
```
Resume the agent coordination system.

**Response:**
```json
{
  "status": "running"
}
```

## Tool Discovery Endpoints

### Get All Tools
```
GET /api/tools
```
Get all available tools across all integration systems.

**Response:**
```json
{
  "lsp": [
    {
      "id": "lsp_python_completion",
      "name": "Python Code Completion",
      "category": "lsp",
      "provider": "pylsp",
      "capabilities": ["completion"]
    }
  ],
  "mcp": [
    {
      "id": "mcp_git_status",
      "name": "Git Status",
      "category": "mcp",
      "provider": "git_mcp",
      "capabilities": ["git", "status"]
    }
  ]
}
```

### Get Tools by Category
```
GET /api/tools/{category}
```
Get tools by category (lsp, mcp, n8n, debug, native).

**Response:**
```json
[
  {
    "id": "lsp_python_completion",
    "name": "Python Code Completion",
    "category": "lsp",
    "provider": "pylsp",
    "capabilities": ["completion"]
  }
]
```

### Invoke Tool
```
POST /api/tools/invoke
```
Invoke a specific tool.

**Request Body:**
```json
{
  "toolId": "mcp_git_status",
  "parameters": {
    "repositoryPath": "."
  }
}
```

**Response:**
```json
{
  "result": {
    "status": "success",
    "data": {
      "modified": ["src/main.py"],
      "staged": [],
      "untracked": ["docs/new_doc.md"]
    }
  }
}
```

### Get Tool Analytics
```
GET /api/tools/analytics
```
Get tool usage analytics.

**Response:**
```json
{
  "totalInvocations": 1250,
  "topTools": [
    {
      "toolId": "lsp_python_completion",
      "invocations": 450,
      "successRate": 0.98
    }
  ],
  "usageByCategory": {
    "lsp": 600,
    "mcp": 300,
    "n8n": 200,
    "debug": 100,
    "native": 50
  }
}
```

### Search Tools
```
GET /api/tools/search
```
Search tools by name or capability.

**Query Parameters:**
- `query` (required): Search query

**Response:**
```json
[
  {
    "id": "lsp_python_completion",
    "name": "Python Code Completion",
    "category": "lsp",
    "provider": "pylsp",
    "capabilities": ["completion"],
    "score": 0.95
  }
]
```

## Development Endpoints

### Test Integrations
```
GET /api/dev/test-integrations
```
Test all integrations and return detailed status.

**Response:**
```json
{
  "status": "success",
  "integrations": {
    "lsp": {
      "status": "healthy",
      "details": "All LSP servers responding"
    },
    "mcp": {
      "status": "healthy",
      "details": "All MCP servers connected"
    }
  }
}
```

### Get System Info
```
GET /api/dev/system-info
```
Get detailed system information.

**Response:**
```json
{
  "pythonVersion": "3.11.4",
  "platform": "Windows-10-10.0.22621-SP0",
  "cpuCount": 16,
  "memory": {
    "total": 34359738368,
    "available": 17179869184
  }
}
```

## WebSocket Interface

Open-Deep-Coder also provides a WebSocket interface for real-time communication:

### Connection
```
WebSocket URL: ws://127.0.0.1:8000/ws
```

### Messages

#### Agent Status Updates
```json
{
  "type": "agent_status",
  "agent": "implementer",
  "status": "running",
  "task": "Implementing Fibonacci function"
}
```

#### Debug Events
```json
{
  "type": "debug_event",
  "sessionId": "debug_1",
  "event": "breakpoint_hit",
  "line": 15
}
```

#### File Changes
```json
{
  "type": "file_change",
  "action": "modified",
  "filePath": "/path/to/file.py"
}
```

#### Task Completion
```json
{
  "type": "task_complete",
  "taskId": "task_123",
  "status": "success",
  "result": "Fibonacci function implemented and tested"
}
```

---

*Open-Deep-Coder: Transforming software development through intelligent agent coordination.*