"""
MCP Manager for Open-Deep-Coder

Manages Model Context Protocol integrations for enhanced AI capabilities,
tool discovery, and git integration.
"""

import asyncio
import json
import logging
import os
import subprocess
from dataclasses import dataclass
from enum import Enum
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class MCPServerType(str, Enum):
    STDIO = "stdio"
    HTTP = "http"
    WEBSOCKET = "websocket"


class MCPServerState(str, Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


@dataclass
class MCPTool:
    name: str
    description: str
    parameters: dict[str, Any]
    server_id: str


@dataclass
class MCPServer:
    id: str
    name: str
    type: MCPServerType
    endpoint: str
    command: list[str] | None = None
    working_directory: str | None = None
    state: MCPServerState = MCPServerState.DISCONNECTED
    capabilities: list[str] = None
    tools: dict[str, MCPTool] = None
    process: subprocess.Popen | None = None
    client: httpx.AsyncClient | None = None

    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = []
        if self.tools is None:
            self.tools = {}


class MCPManager:
    """Manages MCP server connections and tool invocations"""

    def __init__(self):
        self.servers: dict[str, MCPServer] = {}
        self.is_initialized = False
        self._next_request_id = 1
        self._pending_requests: dict[int, asyncio.Future] = {}

        # Pre-configured MCP servers
        self._server_configs = {
            "git_mcp": {
                "name": "Git MCP Server",
                "type": MCPServerType.STDIO,
                "command": ["npx", "@modelcontextprotocol/server-git"],
                "capabilities": ["git_operations", "repository_management"],
            },
            "filesystem_mcp": {
                "name": "Filesystem MCP Server",
                "type": MCPServerType.STDIO,
                "command": ["npx", "@modelcontextprotocol/server-filesystem"],
                "capabilities": ["file_operations", "directory_browsing"],
            },
            "web_mcp": {
                "name": "Web Search MCP Server",
                "type": MCPServerType.HTTP,
                "endpoint": "http://localhost:8080/mcp",
                "capabilities": ["web_search", "documentation_lookup"],
            },
        }

    async def initialize(self):
        """Initialize MCP manager and discover available servers"""
        logger.info("Initializing MCP Manager...")

        # Discover and connect to available MCP servers
        await self._discover_available_servers()

        self.is_initialized = True
        logger.info(f"MCP Manager initialized with {len(self.servers)} servers")

    async def cleanup(self):
        """Cleanup MCP connections"""
        for server_id in list(self.servers.keys()):
            await self.disconnect_server(server_id)
        self.servers.clear()

    async def _discover_available_servers(self):
        """Discover which MCP servers are available"""
        for server_id, config in self._server_configs.items():
            try:
                if config["type"] == MCPServerType.STDIO and config.get("command"):
                    # Test if the command is available
                    result = await asyncio.create_subprocess_exec(
                        config["command"][0],
                        "--help",
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    await result.communicate()

                    if result.returncode == 0:
                        logger.info(f"Found MCP server: {config['name']}")
                        server = MCPServer(
                            id=server_id,
                            name=config["name"],
                            type=MCPServerType(config["type"]),
                            endpoint="",
                            command=config["command"],
                            working_directory=os.getcwd(),
                            capabilities=config.get("capabilities", []),
                        )
                        self.servers[server_id] = server

                elif config["type"] == MCPServerType.HTTP:
                    # Test HTTP endpoint availability
                    try:
                        async with httpx.AsyncClient() as client:
                            response = await client.get(
                                config["endpoint"] + "/health", timeout=2.0
                            )
                            if response.status_code == 200:
                                logger.info(f"Found HTTP MCP server: {config['name']}")
                                server = MCPServer(
                                    id=server_id,
                                    name=config["name"],
                                    type=MCPServerType(config["type"]),
                                    endpoint=config["endpoint"],
                                    capabilities=config.get("capabilities", []),
                                )
                                self.servers[server_id] = server
                    except Exception:
                        pass  # Server not available

            except Exception as e:
                logger.debug(f"MCP server {config['name']} not available: {e}")

    async def connect_server(self, server_id: str) -> bool:
        """Connect to a specific MCP server"""
        if server_id not in self.servers:
            logger.error(f"Unknown MCP server: {server_id}")
            return False

        server = self.servers[server_id]
        if server.state == MCPServerState.CONNECTED:
            return True

        try:
            server.state = MCPServerState.CONNECTING
            logger.info(f"Connecting to MCP server: {server.name}")

            if server.type == MCPServerType.STDIO:
                await self._connect_stdio_server(server)
            elif server.type == MCPServerType.HTTP:
                await self._connect_http_server(server)
            else:
                logger.error(f"Unsupported MCP server type: {server.type}")
                return False

            # Discover tools
            await self._discover_server_tools(server)

            server.state = MCPServerState.CONNECTED
            logger.info(f"Successfully connected to MCP server: {server.name}")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to MCP server {server.name}: {e}")
            server.state = MCPServerState.ERROR
            return False

    async def disconnect_server(self, server_id: str):
        """Disconnect from a specific MCP server"""
        if server_id not in self.servers:
            return

        server = self.servers[server_id]
        try:
            if server.process:
                server.process.terminate()
                await server.process.wait()
                server.process = None

            if server.client:
                await server.client.aclose()
                server.client = None

            server.state = MCPServerState.DISCONNECTED
            logger.info(f"Disconnected from MCP server: {server.name}")

        except Exception as e:
            logger.error(f"Error disconnecting from MCP server {server.name}: {e}")

    async def _connect_stdio_server(self, server: MCPServer):
        """Connect to a stdio-based MCP server"""
        if not server.command:
            raise ValueError("No command specified for stdio server")

        server.process = await asyncio.create_subprocess_exec(
            *server.command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=server.working_directory,
        )

        # Send initialize request
        await self._send_initialize_request(server)

    async def _connect_http_server(self, server: MCPServer):
        """Connect to an HTTP-based MCP server"""
        server.client = httpx.AsyncClient(base_url=server.endpoint)

        # Test connection
        response = await server.client.get("/health")
        if response.status_code != 200:
            raise Exception(f"HTTP server health check failed: {response.status_code}")

    async def _send_initialize_request(self, server: MCPServer):
        """Send MCP initialize request"""
        request = {
            "jsonrpc": "2.0",
            "id": self._get_next_request_id(),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "prompts": {},
                    "resources": {},
                    "logging": {},
                },
                "clientInfo": {"name": "Open-Deep-Coder", "version": "0.1.0"},
            },
        }

        if server.type == MCPServerType.STDIO:
            await self._send_stdio_request(server, request)
        elif server.type == MCPServerType.HTTP:
            await self._send_http_request(server, request)

    async def _discover_server_tools(self, server: MCPServer):
        """Discover available tools on the MCP server"""
        request = {
            "jsonrpc": "2.0",
            "id": self._get_next_request_id(),
            "method": "tools/list",
            "params": {},
        }

        try:
            if server.type == MCPServerType.STDIO:
                response = await self._send_stdio_request(server, request)
            elif server.type == MCPServerType.HTTP:
                response = await self._send_http_request(server, request)
            else:
                return

            if "result" in response and "tools" in response["result"]:
                for tool_data in response["result"]["tools"]:
                    tool = MCPTool(
                        name=tool_data["name"],
                        description=tool_data.get("description", ""),
                        parameters=tool_data.get("inputSchema", {}),
                        server_id=server.id,
                    )
                    server.tools[tool.name] = tool

                logger.info(f"Discovered {len(server.tools)} tools for {server.name}")

        except Exception as e:
            logger.error(f"Failed to discover tools for {server.name}: {e}")

    async def invoke_tool(
        self, server_id: str, tool_name: str, parameters: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke a tool on an MCP server"""
        if server_id not in self.servers:
            return {"error": f"Unknown MCP server: {server_id}"}

        server = self.servers[server_id]
        if server.state != MCPServerState.CONNECTED:
            # Try to connect
            if not await self.connect_server(server_id):
                return {"error": f"Failed to connect to MCP server: {server_id}"}

        if tool_name not in server.tools:
            return {"error": f"Tool {tool_name} not found on server {server_id}"}

        try:
            request = {
                "jsonrpc": "2.0",
                "id": self._get_next_request_id(),
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": parameters},
            }

            if server.type == MCPServerType.STDIO:
                response = await self._send_stdio_request(server, request)
            elif server.type == MCPServerType.HTTP:
                response = await self._send_http_request(server, request)
            else:
                return {"error": f"Unsupported server type: {server.type}"}

            if "error" in response:
                return {"error": response["error"]["message"]}

            return response.get("result", {})

        except Exception as e:
            logger.error(f"Error invoking tool {tool_name} on {server_id}: {e}")
            return {"error": str(e)}

    async def _send_stdio_request(
        self, server: MCPServer, request: dict[str, Any]
    ) -> dict[str, Any]:
        """Send request to stdio MCP server"""
        if not server.process or not server.process.stdin:
            raise Exception("Server process not available")

        message = json.dumps(request) + "\n"
        server.process.stdin.write(message.encode())
        await server.process.stdin.drain()

        # Read response (simplified - real implementation would need proper framing)
        if server.process.stdout:
            line = await server.process.stdout.readline()
            return json.loads(line.decode().strip())

        return {"error": "No response received"}

    async def _send_http_request(
        self, server: MCPServer, request: dict[str, Any]
    ) -> dict[str, Any]:
        """Send request to HTTP MCP server"""
        if not server.client:
            raise Exception("HTTP client not available")

        response = await server.client.post("/mcp", json=request)
        return response.json()

    def _get_next_request_id(self) -> int:
        request_id = self._next_request_id
        self._next_request_id += 1
        return request_id

    def get_available_tools(self) -> list[dict[str, Any]]:
        """Get all available tools across all connected servers"""
        tools = []
        for server in self.servers.values():
            if server.state == MCPServerState.CONNECTED:
                for tool in server.tools.values():
                    tools.append(
                        {
                            "name": tool.name,
                            "description": tool.description,
                            "parameters": tool.parameters,
                            "server_id": tool.server_id,
                            "server_name": server.name,
                        }
                    )
        return tools

    def get_server_status(self) -> list[dict[str, Any]]:
        """Get status of all MCP servers"""
        return [
            {
                "id": server.id,
                "name": server.name,
                "type": server.type.value,
                "state": server.state.value,
                "capabilities": server.capabilities,
                "tools_count": len(server.tools),
                "tools": list(server.tools.keys()),
            }
            for server in self.servers.values()
        ]

    # Git integration methods using MCP

    async def git_status(self, repository_path: str) -> dict[str, Any]:
        """Get git status using MCP git server"""
        return await self.invoke_tool(
            "git_mcp", "git_status", {"path": repository_path}
        )

    async def git_commit(
        self, repository_path: str, message: str, files: list[str] | None = None
    ) -> dict[str, Any]:
        """Commit changes using MCP git server"""
        params = {"path": repository_path, "message": message}
        if files:
            params["files"] = files
        return await self.invoke_tool("git_mcp", "git_commit", params)

    async def git_push(
        self, repository_path: str, remote: str = "origin", branch: str = "main"
    ) -> dict[str, Any]:
        """Push changes using MCP git server"""
        return await self.invoke_tool(
            "git_mcp",
            "git_push",
            {"path": repository_path, "remote": remote, "branch": branch},
        )

    async def git_pull(
        self, repository_path: str, remote: str = "origin", branch: str = "main"
    ) -> dict[str, Any]:
        """Pull changes using MCP git server"""
        return await self.invoke_tool(
            "git_mcp",
            "git_pull",
            {"path": repository_path, "remote": remote, "branch": branch},
        )
