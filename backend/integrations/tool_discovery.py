"""
Tool Discovery and Management System for Open-Deep-Coder

Unified discovery, registration, and management of tools across LSP, MCP, n8n, and debugging.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ToolType(str, Enum):
    LSP = "lsp"
    MCP = "mcp"
    N8N = "n8n"
    DEBUG = "debug"
    NATIVE = "native"


@dataclass
class Tool:
    id: str
    name: str
    description: str
    type: ToolType
    source: str
    capabilities: list[str] = field(default_factory=list)
    usage_count: int = 0
    last_used: datetime | None = None


class ToolDiscoveryManager:
    """Manages discovery and registration of tools from various sources"""

    def __init__(self) -> None:
        self.tools: dict[str, Tool] = {}
        self.providers: dict[str, Any] = {}
        self.is_initialized = False

    async def initialize(self, integrations: dict[str, Any]) -> None:
        """Initialize tool discovery with integration managers"""
        logger.info("Initializing Tool Discovery Manager...")

        self.providers = integrations
        await self._discover_all_tools()

        self.is_initialized = True
        logger.info(f"Tool Discovery Manager initialized with {len(self.tools)} tools")

    async def _discover_all_tools(self) -> None:
        """Discover tools from all sources"""
        # LSP Tools
        if "lsp" in self.providers:
            lsp_manager = self.providers["lsp"]
            if lsp_manager.is_initialized:
                servers = lsp_manager.get_server_status()
                for server in servers:
                    if server["state"] == "running":
                        capabilities = []
                        if server["capabilities"].get("completion"):
                            capabilities.append("code_completion")
                        if server["capabilities"].get("hover"):
                            capabilities.append("hover_info")
                        if server["capabilities"].get("diagnostics"):
                            capabilities.append("diagnostics")

                        tool_id = f"lsp_{server['language']}"
                        self.tools[tool_id] = Tool(
                            id=tool_id,
                            name=f"{server['language'].title()} LSP",
                            description=f"Language server for {server['language']}",
                            type=ToolType.LSP,
                            source=server["id"],
                            capabilities=capabilities,
                        )

        # MCP Tools
        if "mcp" in self.providers:
            mcp_manager = self.providers["mcp"]
            if mcp_manager.is_initialized:
                available_tools = mcp_manager.get_available_tools()
                for tool_data in available_tools:
                    tool_id = f"mcp_{tool_data['name']}"
                    self.tools[tool_id] = Tool(
                        id=tool_id,
                        name=tool_data["name"],
                        description=tool_data["description"],
                        type=ToolType.MCP,
                        source=tool_data["server_id"],
                        capabilities=["invoke"],
                    )

        # n8n Tools
        if "n8n" in self.providers:
            n8n_manager = self.providers["n8n"]
            if n8n_manager.is_initialized:
                workflows = n8n_manager.get_workflow_status()
                for workflow in workflows:
                    if workflow["status"] == "active":
                        tool_id = f"n8n_{workflow['id']}"
                        self.tools[tool_id] = Tool(
                            id=tool_id,
                            name=f"n8n: {workflow['name']}",
                            description=f"Execute workflow: {workflow['name']}",
                            type=ToolType.N8N,
                            source=workflow["id"],
                            capabilities=["execute_workflow"],
                        )

        # Debug Tools
        if "debug" in self.providers:
            debug_manager = self.providers["debug"]
            if debug_manager.is_initialized:
                self.tools["debug_core"] = Tool(
                    id="debug_core",
                    name="Debug Core",
                    description="Core debugging capabilities",
                    type=ToolType.DEBUG,
                    source="debug_manager",
                    capabilities=[
                        "start_session",
                        "set_breakpoint",
                        "step_over",
                        "evaluate",
                    ],
                )

        # Native Tools
        self.tools["filesystem"] = Tool(
            id="filesystem",
            name="File System",
            description="File system operations",
            type=ToolType.NATIVE,
            source="native",
            capabilities=["read_file", "write_file", "list_directory"],
        )

        self.tools["code_execution"] = Tool(
            id="code_execution",
            name="Code Execution",
            description="Code execution and testing",
            type=ToolType.NATIVE,
            source="native",
            capabilities=["run_command", "run_tests"],
        )

    async def invoke_tool(
        self, tool_id: str, capability: str, parameters: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke a tool capability"""
        if tool_id not in self.tools:
            return {"error": f"Tool {tool_id} not found"}

        tool = self.tools[tool_id]
        tool.usage_count += 1
        tool.last_used = datetime.now()

        try:
            if tool.type == ToolType.LSP:
                return await self._invoke_lsp_tool(tool, capability, parameters)
            elif tool.type == ToolType.MCP:
                return await self._invoke_mcp_tool(tool, capability, parameters)
            elif tool.type == ToolType.N8N:
                return await self._invoke_n8n_tool(tool, capability, parameters)
            elif tool.type == ToolType.DEBUG:
                return await self._invoke_debug_tool(tool, capability, parameters)
            elif tool.type == ToolType.NATIVE:
                return await self._invoke_native_tool(tool, capability, parameters)
        except Exception as e:
            logger.error(f"Error invoking tool {tool_id}: {e}")
            return {"error": str(e)}

    async def _invoke_lsp_tool(
        self, tool: Tool, capability: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke LSP tool"""
        lsp_manager = self.providers["lsp"]
        language = tool.source.split("_")[1]

        if capability == "code_completion":
            result = await lsp_manager.get_completions(
                params["file_path"], params["position"], language
            )
            return {"completions": result}
        elif capability == "hover_info":
            result = await lsp_manager.get_hover_info(
                params["file_path"], params["position"], language
            )
            return {"hover_info": result}
        elif capability == "diagnostics":
            result = await lsp_manager.get_diagnostics(params["file_path"], language)
            return {"diagnostics": result}
        else:
            return {"error": f"Unknown LSP capability: {capability}"}

    async def _invoke_mcp_tool(
        self, tool: Tool, capability: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke MCP tool"""
        mcp_manager = self.providers["mcp"]
        from typing import cast
        result = await mcp_manager.invoke_tool(
            tool.source, tool.name.split("_", 1)[1], params
        )
        return cast(dict[str, Any], result)

    async def _invoke_n8n_tool(
        self, tool: Tool, capability: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke n8n workflow"""
        n8n_manager = self.providers["n8n"]
        execution_id = await n8n_manager.execute_workflow(
            tool.source, params.get("data", {})
        )
        return (
            {"execution_id": execution_id}
            if execution_id
            else {"error": "Failed to start workflow"}
        )

    async def _invoke_debug_tool(
        self, tool: Tool, capability: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke debug tool"""
        debug_manager = self.providers["debug"]

        if capability == "start_session":
            session_id = await debug_manager.start_debug_session(
                params["file_path"], params["language"], params.get("config")
            )
            return (
                {"session_id": session_id}
                if session_id
                else {"error": "Failed to start session"}
            )
        elif capability == "set_breakpoint":
            bp_id = await debug_manager.set_breakpoint(
                params["session_id"],
                params["file_path"],
                params["line"],
                params.get("condition"),
            )
            return (
                {"breakpoint_id": bp_id}
                if bp_id
                else {"error": "Failed to set breakpoint"}
            )
        # Add other debug capabilities...
        else:
            return {"error": f"Unknown debug capability: {capability}"}

    async def _invoke_native_tool(
        self, tool: Tool, capability: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Invoke native tool"""
        # Simple implementation for native tools
        return {"result": f"Native tool {capability} executed", "parameters": params}

    def get_available_tools(self, category: str | None = None) -> list[dict[str, Any]]:
        """Get available tools with optional filtering"""
        tools = list(self.tools.values())

        if category:
            tools = [t for t in tools if t.type.value == category]

        return [
            {
                "id": tool.id,
                "name": tool.name,
                "description": tool.description,
                "type": tool.type.value,
                "capabilities": tool.capabilities,
                "usage_count": tool.usage_count,
                "last_used": tool.last_used.isoformat() if tool.last_used else None,
            }
            for tool in tools
        ]

    def get_usage_analytics(self) -> dict[str, Any]:
        """Get tool usage analytics"""
        total_usages = sum(tool.usage_count for tool in self.tools.values())
        most_used = sorted(
            self.tools.values(), key=lambda t: t.usage_count, reverse=True
        )[:5]

        return {
            "total_tools": len(self.tools),
            "total_usages": total_usages,
            "most_used_tools": [
                {"id": tool.id, "name": tool.name, "usage_count": tool.usage_count}
                for tool in most_used
            ],
            "by_category": {
                tool_type.value: len(
                    [t for t in self.tools.values() if t.type == tool_type]
                )
                for tool_type in ToolType
            },
        }
