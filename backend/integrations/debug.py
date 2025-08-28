"""
Debug Manager for Open-Deep-Coder

Manages debugging sessions with support for multiple languages,
Debug Adapter Protocol (DAP), breakpoint management, and variable inspection.
"""

import asyncio
import json
import logging
import subprocess
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import os

logger = logging.getLogger(__name__)

class DebugState(str, Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    TERMINATED = "terminated"
    ERROR = "error"

class BreakpointType(str, Enum):
    LINE = "line"
    FUNCTION = "function"
    EXCEPTION = "exception"
    CONDITIONAL = "conditional"

@dataclass
class Breakpoint:
    id: str
    file_path: str
    line: int
    type: BreakpointType = BreakpointType.LINE
    condition: Optional[str] = None
    hit_count: int = 0
    enabled: bool = True

@dataclass
class StackFrame:
    id: str
    name: str
    file_path: str
    line: int
    column: int
    variables: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Variable:
    name: str
    value: str
    type: str
    evaluatable: bool = True
    children: List['Variable'] = field(default_factory=list)

@dataclass
class DebugSession:
    id: str
    language: str
    file_path: str
    state: DebugState
    process: Optional[subprocess.Popen] = None
    adapter_command: List[str] = field(default_factory=list)
    breakpoints: Dict[str, Breakpoint] = field(default_factory=dict)
    stack_frames: List[StackFrame] = field(default_factory=list)
    current_frame: Optional[StackFrame] = None
    
class DebugManager:
    """Manages debugging sessions and Debug Adapter Protocol integration"""
    
    def __init__(self):
        self.sessions: Dict[str, DebugSession] = {}
        self.is_initialized = False
        self._next_session_id = 1
        self._next_breakpoint_id = 1
        
        # Debug adapter configurations
        self._adapter_configs = {
            "python": {
                "name": "Python Debugger",
                "command": ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "--wait-for-client"],
                "type": "dap",
                "capabilities": ["breakpoints", "variables", "evaluation", "stepping"]
            },
            "typescript": {
                "name": "Node.js Debugger",
                "command": ["node", "--inspect-brk=0.0.0.0:9229"],
                "type": "dap",
                "capabilities": ["breakpoints", "variables", "evaluation", "stepping"]
            },
            "javascript": {
                "name": "Node.js Debugger",
                "command": ["node", "--inspect-brk=0.0.0.0:9229"],
                "type": "dap",
                "capabilities": ["breakpoints", "variables", "evaluation", "stepping"]
            },
            "rust": {
                "name": "Rust Debugger",
                "command": ["rust-gdb"],
                "type": "gdb",
                "capabilities": ["breakpoints", "variables", "stepping"]
            },
            "go": {
                "name": "Delve Debugger",
                "command": ["dlv", "debug"],
                "type": "delve",
                "capabilities": ["breakpoints", "variables", "evaluation", "stepping"]
            }
        }
    
    async def initialize(self):
        """Initialize debug manager and check available debuggers"""
        logger.info("Initializing Debug Manager...")
        
        # Check which debug adapters are available
        available_adapters = []
        for language, config in self._adapter_configs.items():
            try:
                # Test if the adapter command is available
                if config["type"] == "dap":
                    # Check if debugpy, node, etc. are available
                    if language == "python":
                        result = await asyncio.create_subprocess_exec(
                            "python", "-m", "debugpy", "--help",
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE
                        )
                    elif language in ["typescript", "javascript"]:
                        result = await asyncio.create_subprocess_exec(
                            "node", "--version",
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE
                        )
                    else:
                        continue
                    
                    await result.communicate()
                    if result.returncode == 0:
                        available_adapters.append(language)
                        logger.info(f"Found debug adapter for {language}")
                
            except Exception as e:
                logger.debug(f"Debug adapter for {language} not available: {e}")
        
        self.is_initialized = True
        logger.info(f"Debug Manager initialized with {len(available_adapters)} adapters")
    
    async def cleanup(self):
        """Cleanup all debug sessions"""
        for session_id in list(self.sessions.keys()):
            await self.stop_debug_session(session_id)
        self.sessions.clear()
    
    async def start_debug_session(self, file_path: str, language: str, config: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Start a new debug session"""
        if language not in self._adapter_configs:
            logger.error(f"No debug adapter available for language: {language}")
            return None
        
        adapter_config = self._adapter_configs[language]
        session_id = self._get_next_session_id()
        
        try:
            # Create debug session
            session = DebugSession(
                id=session_id,
                language=language,
                file_path=file_path,
                state=DebugState.STARTING,
                adapter_command=adapter_config["command"].copy()
            )
            
            # Customize command for specific file
            if language == "python":
                session.adapter_command.append(file_path)
            elif language in ["typescript", "javascript"]:
                session.adapter_command.append(file_path)
            
            self.sessions[session_id] = session
            
            # Start the debug adapter process
            await self._start_adapter_process(session, config or {})
            
            logger.info(f"Started debug session {session_id} for {file_path}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start debug session: {e}")
            if session_id in self.sessions:
                del self.sessions[session_id]
            return None
    
    async def stop_debug_session(self, session_id: str) -> bool:
        """Stop a debug session"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        try:
            if session.process:
                # Send terminate signal
                session.process.terminate()
                await session.process.wait()
                session.process = None
            
            session.state = DebugState.TERMINATED
            logger.info(f"Stopped debug session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping debug session {session_id}: {e}")
            session.state = DebugState.ERROR
            return False
        finally:
            del self.sessions[session_id]
    
    async def set_breakpoint(self, session_id: str, file_path: str, line: int, 
                           condition: Optional[str] = None) -> Optional[str]:
        """Set a breakpoint in a debug session"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        breakpoint_id = self._get_next_breakpoint_id()
        
        breakpoint = Breakpoint(
            id=breakpoint_id,
            file_path=file_path,
            line=line,
            condition=condition,
            type=BreakpointType.CONDITIONAL if condition else BreakpointType.LINE
        )
        
        session.breakpoints[breakpoint_id] = breakpoint
        
        # Send breakpoint to debug adapter (DAP protocol)
        if session.state == DebugState.RUNNING:
            await self._send_set_breakpoints_request(session, file_path)
        
        logger.info(f"Set breakpoint {breakpoint_id} at {file_path}:{line}")
        return breakpoint_id
    
    async def remove_breakpoint(self, session_id: str, breakpoint_id: str) -> bool:
        """Remove a breakpoint"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if breakpoint_id not in session.breakpoints:
            return False
        
        breakpoint = session.breakpoints[breakpoint_id]
        del session.breakpoints[breakpoint_id]
        
        # Update debug adapter
        if session.state == DebugState.RUNNING:
            await self._send_set_breakpoints_request(session, breakpoint.file_path)
        
        logger.info(f"Removed breakpoint {breakpoint_id}")
        return True
    
    async def continue_execution(self, session_id: str) -> bool:
        """Continue execution from a paused state"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return False
        
        try:
            await self._send_continue_request(session)
            session.state = DebugState.RUNNING
            return True
        except Exception as e:
            logger.error(f"Error continuing execution: {e}")
            return False
    
    async def step_over(self, session_id: str) -> bool:
        """Step over the current line"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return False
        
        try:
            await self._send_step_over_request(session)
            return True
        except Exception as e:
            logger.error(f"Error stepping over: {e}")
            return False
    
    async def step_into(self, session_id: str) -> bool:
        """Step into the current function call"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return False
        
        try:
            await self._send_step_into_request(session)
            return True
        except Exception as e:
            logger.error(f"Error stepping into: {e}")
            return False
    
    async def step_out(self, session_id: str) -> bool:
        """Step out of the current function"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return False
        
        try:
            await self._send_step_out_request(session)
            return True
        except Exception as e:
            logger.error(f"Error stepping out: {e}")
            return False
    
    async def evaluate_expression(self, session_id: str, expression: str, 
                                 frame_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Evaluate an expression in the debug context"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return None
        
        try:
            result = await self._send_evaluate_request(session, expression, frame_id)
            return result
        except Exception as e:
            logger.error(f"Error evaluating expression: {e}")
            return None
    
    async def get_variables(self, session_id: str, frame_id: Optional[str] = None) -> List[Variable]:
        """Get variables for the current or specified frame"""
        if session_id not in self.sessions:
            return []
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return []
        
        try:
            variables = await self._send_variables_request(session, frame_id)
            return variables
        except Exception as e:
            logger.error(f"Error getting variables: {e}")
            return []
    
    async def get_stack_trace(self, session_id: str) -> List[StackFrame]:
        """Get the current stack trace"""
        if session_id not in self.sessions:
            return []
        
        session = self.sessions[session_id]
        if session.state != DebugState.PAUSED:
            return []
        
        try:
            stack_frames = await self._send_stack_trace_request(session)
            session.stack_frames = stack_frames
            return stack_frames
        except Exception as e:
            logger.error(f"Error getting stack trace: {e}")
            return []
    
    def get_session_status(self) -> List[Dict[str, Any]]:
        """Get status of all debug sessions"""
        return [
            {
                "id": session.id,
                "language": session.language,
                "file_path": session.file_path,
                "state": session.state.value,
                "breakpoints_count": len(session.breakpoints),
                "breakpoints": [
                    {
                        "id": bp.id,
                        "file_path": bp.file_path,
                        "line": bp.line,
                        "enabled": bp.enabled,
                        "condition": bp.condition
                    }
                    for bp in session.breakpoints.values()
                ]
            }
            for session in self.sessions.values()
        ]
    
    # Internal helper methods
    
    def _get_next_session_id(self) -> str:
        session_id = f"debug_session_{self._next_session_id}"
        self._next_session_id += 1
        return session_id
    
    def _get_next_breakpoint_id(self) -> str:
        breakpoint_id = f"bp_{self._next_breakpoint_id}"
        self._next_breakpoint_id += 1
        return breakpoint_id
    
    async def _start_adapter_process(self, session: DebugSession, config: Dict[str, Any]):
        """Start the debug adapter process"""
        # For now, create a placeholder process
        # Real implementation would start the actual debug adapter
        session.state = DebugState.RUNNING
        logger.info(f"Debug adapter process started for session {session.id}")
    
    async def _send_set_breakpoints_request(self, session: DebugSession, file_path: str):
        """Send setBreakpoints request to debug adapter"""
        # DAP protocol implementation would go here
        breakpoints_for_file = [
            bp for bp in session.breakpoints.values() 
            if bp.file_path == file_path and bp.enabled
        ]
        logger.debug(f"Setting {len(breakpoints_for_file)} breakpoints for {file_path}")
    
    async def _send_continue_request(self, session: DebugSession):
        """Send continue request to debug adapter"""
        logger.debug(f"Sending continue request for session {session.id}")
    
    async def _send_step_over_request(self, session: DebugSession):
        """Send step over request to debug adapter"""
        logger.debug(f"Sending step over request for session {session.id}")
    
    async def _send_step_into_request(self, session: DebugSession):
        """Send step into request to debug adapter"""
        logger.debug(f"Sending step into request for session {session.id}")
    
    async def _send_step_out_request(self, session: DebugSession):
        """Send step out request to debug adapter"""
        logger.debug(f"Sending step out request for session {session.id}")
    
    async def _send_evaluate_request(self, session: DebugSession, expression: str, 
                                   frame_id: Optional[str] = None) -> Dict[str, Any]:
        """Send evaluate request to debug adapter"""
        logger.debug(f"Evaluating expression: {expression}")
        # Mock result for now
        return {
            "result": f"mock_result_for_{expression}",
            "type": "string",
            "evaluatable": True
        }
    
    async def _send_variables_request(self, session: DebugSession, 
                                    frame_id: Optional[str] = None) -> List[Variable]:
        """Send variables request to debug adapter"""
        logger.debug(f"Getting variables for frame {frame_id or 'current'}")
        # Mock variables for now
        return [
            Variable(name="x", value="42", type="int"),
            Variable(name="message", value="'Hello, World!'", type="str"),
            Variable(name="items", value="[1, 2, 3]", type="list")
        ]
    
    async def _send_stack_trace_request(self, session: DebugSession) -> List[StackFrame]:
        """Send stack trace request to debug adapter"""
        logger.debug(f"Getting stack trace for session {session.id}")
        # Mock stack trace for now
        return [
            StackFrame(
                id="frame_1",
                name="main",
                file_path=session.file_path,
                line=10,
                column=1
            ),
            StackFrame(
                id="frame_2",
                name="function_call",
                file_path=session.file_path,
                line=5,
                column=8
            )
        ]