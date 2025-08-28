"""
Enhanced LSP Manager for Open-Deep-Coder

Manages Language Server Protocol integrations with support for multiple languages,
real-time diagnostics, code completion, and debugging capabilities.
"""

import asyncio
import json
import logging
import os
import subprocess
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class LSPServerState(str, Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    ERROR = "error"
    RESTARTING = "restarting"

@dataclass
class LSPCapabilities:
    text_document_sync: bool = False
    completion: bool = False
    hover: bool = False
    signature_help: bool = False
    definition: bool = False
    references: bool = False
    document_highlight: bool = False
    document_symbol: bool = False
    workspace_symbol: bool = False
    code_action: bool = False
    code_lens: bool = False
    document_formatting: bool = False
    document_range_formatting: bool = False
    document_on_type_formatting: bool = False
    rename: bool = False
    folding_range: bool = False
    diagnostic: bool = False
    debug_support: bool = False

@dataclass
class LSPServer:
    id: str
    name: str
    language: str
    command: List[str]
    args: List[str]
    working_directory: str
    state: LSPServerState
    capabilities: LSPCapabilities
    process: Optional[subprocess.Popen] = None
    stdin_queue: Optional[asyncio.Queue] = None
    stdout_queue: Optional[asyncio.Queue] = None
    
class LSPManager:
    """Enhanced LSP Manager with real language server support"""
    
    def __init__(self):
        self.servers: Dict[str, LSPServer] = {}
        self.language_mappings: Dict[str, str] = {}
        self.is_initialized = False
        self._next_request_id = 1
        self._pending_requests: Dict[int, asyncio.Future] = {}
        
        # Language server configurations
        self._server_configs = {
            "python": {
                "name": "Pylsp",
                "command": ["pylsp"],
                "capabilities": LSPCapabilities(
                    text_document_sync=True,
                    completion=True,
                    hover=True,
                    definition=True,
                    references=True,
                    diagnostic=True,
                    code_action=True,
                    document_formatting=True,
                    debug_support=True
                )
            },
            "typescript": {
                "name": "TypeScript Language Server",
                "command": ["typescript-language-server", "--stdio"],
                "capabilities": LSPCapabilities(
                    text_document_sync=True,
                    completion=True,
                    hover=True,
                    definition=True,
                    references=True,
                    diagnostic=True,
                    code_action=True,
                    document_formatting=True,
                    debug_support=True
                )
            },
            "javascript": {
                "name": "TypeScript Language Server",
                "command": ["typescript-language-server", "--stdio"],
                "capabilities": LSPCapabilities(
                    text_document_sync=True,
                    completion=True,
                    hover=True,
                    definition=True,
                    references=True,
                    diagnostic=True
                )
            },
            "rust": {
                "name": "Rust Analyzer",
                "command": ["rust-analyzer"],
                "capabilities": LSPCapabilities(
                    text_document_sync=True,
                    completion=True,
                    hover=True,
                    definition=True,
                    references=True,
                    diagnostic=True,
                    code_action=True,
                    document_formatting=True,
                    debug_support=True
                )
            }
        }
    
    async def initialize(self):
        """Initialize LSP manager and discover available language servers"""
        logger.info("Initializing Enhanced LSP Manager...")
        
        # Detect available language servers
        await self._detect_available_servers()
        
        self.is_initialized = True
        logger.info(f"LSP Manager initialized with {len(self.servers)} server configurations")
    
    async def cleanup(self):
        """Cleanup all LSP server connections"""
        for server_id in list(self.servers.keys()):
            await self.stop_server(server_id)
        self.servers.clear()
    
    async def _detect_available_servers(self):
        """Detect which language servers are available on the system"""
        for language, config in self._server_configs.items():
            try:
                # Test if the command is available
                result = await asyncio.create_subprocess_exec(
                    config["command"][0], "--version",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await result.communicate()
                
                if result.returncode == 0:
                    logger.info(f"Found {config['name']} for {language}")
                    # Server is available, add to configurations
                    server_id = f"lsp_{language}"
                    self.servers[server_id] = LSPServer(
                        id=server_id,
                        name=config["name"],
                        language=language,
                        command=config["command"],
                        args=[],
                        working_directory=os.getcwd(),
                        state=LSPServerState.STOPPED,
                        capabilities=config["capabilities"]
                    )
                    self.language_mappings[language] = server_id
                    
            except Exception as e:
                logger.debug(f"Language server {config['name']} not available: {e}")
    
    async def start_server(self, language: str, workspace_path: str) -> Optional[str]:
        """Start an LSP server for a specific language"""
        server_id = self.language_mappings.get(language)
        if not server_id or server_id not in self.servers:
            logger.warning(f"No LSP server available for language: {language}")
            return None
        
        server = self.servers[server_id]
        if server.state == LSPServerState.RUNNING:
            return server_id
        
        try:
            server.state = LSPServerState.STARTING
            logger.info(f"Starting LSP server {server.name} for {language}")
            
            # Start the language server process
            server.process = await asyncio.create_subprocess_exec(
                *server.command,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=workspace_path
            )
            
            # Initialize communication queues
            server.stdin_queue = asyncio.Queue()
            server.stdout_queue = asyncio.Queue()
            
            # Start communication tasks
            asyncio.create_task(self._handle_server_stdout(server))
            asyncio.create_task(self._handle_server_stdin(server))
            
            # Send initialize request
            await self._send_initialize_request(server, workspace_path)
            
            server.state = LSPServerState.RUNNING
            logger.info(f"LSP server {server.name} started successfully")
            return server_id
            
        except Exception as e:
            logger.error(f"Failed to start LSP server {server.name}: {e}")
            server.state = LSPServerState.ERROR
            return None
    
    async def stop_server(self, server_id: str):
        """Stop a specific LSP server"""
        if server_id not in self.servers:
            return
        
        server = self.servers[server_id]
        if server.process:
            try:
                # Send shutdown request
                await self._send_shutdown_request(server)
                
                # Terminate process
                server.process.terminate()
                await server.process.wait()
                
            except Exception as e:
                logger.error(f"Error stopping LSP server {server.name}: {e}")
            finally:
                server.process = None
                server.state = LSPServerState.STOPPED
    
    async def get_completions(self, file_path: str, position: Dict[str, int], language: str) -> List[Dict[str, Any]]:
        """Get code completions at a specific position"""
        server_id = self.language_mappings.get(language)
        if not server_id or server_id not in self.servers:
            return []
        
        server = self.servers[server_id]
        if server.state != LSPServerState.RUNNING:
            # Try to start the server
            await self.start_server(language, os.path.dirname(file_path))
            if server.state != LSPServerState.RUNNING:
                return []
        
        try:
            # Send completion request
            request_id = self._get_next_request_id()
            request = {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "textDocument/completion",
                "params": {
                    "textDocument": {"uri": f"file://{file_path}"},
                    "position": position
                }
            }
            
            # Create future for response
            future = asyncio.Future()
            self._pending_requests[request_id] = future
            
            # Send request
            await self._send_request(server, request)
            
            # Wait for response (with timeout)
            try:
                response = await asyncio.wait_for(future, timeout=5.0)
                return response.get("result", {}).get("items", [])
            except asyncio.TimeoutError:
                logger.warning(f"Completion request timed out for {file_path}")
                return []
            finally:
                self._pending_requests.pop(request_id, None)
                
        except Exception as e:
            logger.error(f"Error getting completions: {e}")
            return []
    
    async def get_hover_info(self, file_path: str, position: Dict[str, int], language: str) -> Optional[str]:
        """Get hover information at a specific position"""
        server_id = self.language_mappings.get(language)
        if not server_id or server_id not in self.servers:
            return None
        
        server = self.servers[server_id]
        if server.state != LSPServerState.RUNNING:
            return None
        
        try:
            request_id = self._get_next_request_id()
            request = {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "textDocument/hover",
                "params": {
                    "textDocument": {"uri": f"file://{file_path}"},
                    "position": position
                }
            }
            
            future = asyncio.Future()
            self._pending_requests[request_id] = future
            
            await self._send_request(server, request)
            
            try:
                response = await asyncio.wait_for(future, timeout=3.0)
                hover_data = response.get("result", {})
                if hover_data and "contents" in hover_data:
                    return hover_data["contents"]
                return None
            except asyncio.TimeoutError:
                return None
            finally:
                self._pending_requests.pop(request_id, None)
                
        except Exception as e:
            logger.error(f"Error getting hover info: {e}")
            return None
    
    async def get_diagnostics(self, file_path: str, language: str) -> List[Dict[str, Any]]:
        """Get diagnostic information for a file"""
        server_id = self.language_mappings.get(language)
        if not server_id or server_id not in self.servers:
            return []
        
        server = self.servers[server_id]
        if server.state != LSPServerState.RUNNING:
            return []
        
        # Diagnostics are typically pushed by the server, not requested
        # This is a placeholder for the diagnostic interface
        return []
    
    def get_server_status(self) -> List[Dict[str, Any]]:
        """Get status of all LSP servers"""
        return [
            {
                "id": server.id,
                "name": server.name,
                "language": server.language,
                "state": server.state.value,
                "capabilities": {
                    "completion": server.capabilities.completion,
                    "hover": server.capabilities.hover,
                    "diagnostics": server.capabilities.diagnostic,
                    "debug_support": server.capabilities.debug_support
                }
            }
            for server in self.servers.values()
        ]
    
    # Internal helper methods
    
    def _get_next_request_id(self) -> int:
        request_id = self._next_request_id
        self._next_request_id += 1
        return request_id
    
    async def _send_request(self, server: LSPServer, request: Dict[str, Any]):
        """Send a request to the LSP server"""
        if server.stdin_queue:
            await server.stdin_queue.put(request)
    
    async def _send_initialize_request(self, server: LSPServer, workspace_path: str):
        """Send initialization request to LSP server"""
        request_id = self._get_next_request_id()
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "initialize",
            "params": {
                "processId": os.getpid(),
                "rootUri": f"file://{workspace_path}",
                "capabilities": {
                    "textDocument": {
                        "completion": {"dynamicRegistration": False},
                        "hover": {"dynamicRegistration": False},
                        "signatureHelp": {"dynamicRegistration": False},
                        "definition": {"dynamicRegistration": False},
                        "references": {"dynamicRegistration": False},
                        "documentHighlight": {"dynamicRegistration": False},
                        "documentSymbol": {"dynamicRegistration": False},
                        "codeAction": {"dynamicRegistration": False},
                        "codeLens": {"dynamicRegistration": False},
                        "formatting": {"dynamicRegistration": False},
                        "rangeFormatting": {"dynamicRegistration": False},
                        "rename": {"dynamicRegistration": False},
                        "publishDiagnostics": {"relatedInformation": True}
                    },
                    "workspace": {
                        "workspaceEdit": {"documentChanges": True},
                        "didChangeConfiguration": {"dynamicRegistration": False},
                        "didChangeWatchedFiles": {"dynamicRegistration": False},
                        "symbol": {"dynamicRegistration": False},
                        "executeCommand": {"dynamicRegistration": False}
                    }
                }
            }
        }
        
        future = asyncio.Future()
        self._pending_requests[request_id] = future
        await self._send_request(server, request)
        
        try:
            await asyncio.wait_for(future, timeout=10.0)
            # Send initialized notification
            notification = {
                "jsonrpc": "2.0",
                "method": "initialized",
                "params": {}
            }
            await self._send_request(server, notification)
        except asyncio.TimeoutError:
            logger.error(f"Initialize request timed out for {server.name}")
        finally:
            self._pending_requests.pop(request_id, None)
    
    async def _send_shutdown_request(self, server: LSPServer):
        """Send shutdown request to LSP server"""
        request_id = self._get_next_request_id()
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "shutdown",
            "params": None
        }
        
        future = asyncio.Future()
        self._pending_requests[request_id] = future
        await self._send_request(server, request)
        
        try:
            await asyncio.wait_for(future, timeout=5.0)
            # Send exit notification
            notification = {
                "jsonrpc": "2.0",
                "method": "exit",
                "params": None
            }
            await self._send_request(server, notification)
        except asyncio.TimeoutError:
            logger.warning(f"Shutdown request timed out for {server.name}")
        finally:
            self._pending_requests.pop(request_id, None)
    
    async def _handle_server_stdout(self, server: LSPServer):
        """Handle stdout from LSP server"""
        if not server.process or not server.process.stdout:
            return
        
        buffer = ""
        try:
            while True:
                data = await server.process.stdout.read(1024)
                if not data:
                    break
                
                buffer += data.decode('utf-8')
                
                # Process complete messages
                while '\r\n\r\n' in buffer:
                    header_end = buffer.index('\r\n\r\n')
                    header = buffer[:header_end]
                    buffer = buffer[header_end + 4:]
                    
                    # Parse content length
                    content_length = 0
                    for line in header.split('\r\n'):
                        if line.startswith('Content-Length:'):
                            content_length = int(line.split(':')[1].strip())
                            break
                    
                    if content_length > 0:
                        # Wait for complete message
                        while len(buffer) < content_length:
                            more_data = await server.process.stdout.read(1024)
                            if not more_data:
                                return
                            buffer += more_data.decode('utf-8')
                        
                        # Extract message
                        message_content = buffer[:content_length]
                        buffer = buffer[content_length:]
                        
                        # Parse and handle message
                        try:
                            message = json.loads(message_content)
                            await self._handle_server_message(message)
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse LSP message: {e}")
                        
        except Exception as e:
            logger.error(f"Error handling server stdout: {e}")
    
    async def _handle_server_stdin(self, server: LSPServer):
        """Handle stdin to LSP server"""
        if not server.process or not server.process.stdin or not server.stdin_queue:
            return
        
        try:
            while True:
                request = await server.stdin_queue.get()
                message_content = json.dumps(request)
                message = f"Content-Length: {len(message_content)}\r\n\r\n{message_content}"
                
                server.process.stdin.write(message.encode('utf-8'))
                await server.process.stdin.drain()
                
        except Exception as e:
            logger.error(f"Error handling server stdin: {e}")
    
    async def _handle_server_message(self, message: Dict[str, Any]):
        """Handle incoming message from LSP server"""
        if "id" in message and message["id"] in self._pending_requests:
            # Response to a request
            future = self._pending_requests[message["id"]]
            if not future.done():
                future.set_result(message)
        elif "method" in message:
            # Notification or request from server
            method = message["method"]
            if method == "textDocument/publishDiagnostics":
                # Handle diagnostic notifications
                await self._handle_diagnostics(message.get("params", {}))
            elif method == "window/logMessage":
                # Handle log messages
                params = message.get("params", {})
                logger.info(f"LSP Log: {params.get('message', '')}")
        else:
            logger.debug(f"Unhandled LSP message: {message}")
    
    async def _handle_diagnostics(self, params: Dict[str, Any]):
        """Handle diagnostic notifications from LSP server"""
        uri = params.get("uri", "")
        diagnostics = params.get("diagnostics", [])
        
        # Store diagnostics for the file
        # This could be expanded to notify the frontend
        logger.debug(f"Received {len(diagnostics)} diagnostics for {uri}")