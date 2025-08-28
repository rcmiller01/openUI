# Debugging Integration

Open-Deep-Coder provides comprehensive debugging support through the Debug Adapter Protocol (DAP) integration, enabling multi-language debugging with a unified interface.

## Overview

The debugging integration supports multiple programming languages with full debugging capabilities including:
- Breakpoint management
- Variable inspection
- Call stack navigation
- Step execution control
- Expression evaluation
- Conditional breakpoints
- Exception handling

## Supported Languages

The system currently supports debugging for:
- **Python** - Using `debugpy`
- **TypeScript/JavaScript** - Using Node.js inspector
- **Rust** - Using `rust-gdb`
- **Go** - Using `delve`

## Setup and Configuration

### Prerequisites

Install the required debug adapters on your system:

#### Python (debugpy)
```bash
pip install debugpy
```

#### TypeScript/JavaScript (Node.js)
Node.js comes with built-in inspector support.

#### Rust (rust-gdb)
```bash
# Install GDB
# On Ubuntu/Debian:
sudo apt-get install gdb

# On macOS:
brew install gdb

# Rust debugging support is included with rustc
```

#### Go (delve)
```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

### Configuration

Debugging configurations are managed through the backend service. Language-specific settings can be customized as needed.

## Features

### Breakpoint Management
- Line breakpoints
- Conditional breakpoints
- Function breakpoints
- Exception breakpoints
- Hit count tracking

### Variable Inspection
- Real-time variable values
- Complex data structure visualization
- Variable type information
- Memory address display (where applicable)

### Call Stack Navigation
- Full call stack visualization
- Frame selection and inspection
- Parameter and local variable display
- Source code context

### Execution Control
- Continue execution
- Step over
- Step into
- Step out
- Pause execution
- Terminate session

### Expression Evaluation
- Evaluate expressions in current context
- Watch expressions
- Interactive console
- Memory inspection

## API Endpoints

The frontend communicates with the debugging integration through these backend endpoints:

- `GET /api/debug/sessions` - Get status of all debug sessions
- `POST /api/debug/start` - Start a new debug session
- `POST /api/debug/breakpoint` - Set a breakpoint
- `POST /api/debug/continue` - Continue execution
- `POST /api/debug/step-over` - Step over current line
- `POST /api/debug/step-into` - Step into function call
- `POST /api/debug/step-out` - Step out of current function
- `POST /api/debug/evaluate` - Evaluate expression in debug context
- `GET /api/debug/variables` - Get variables in current frame
- `GET /api/debug/stack` - Get current call stack

## Architecture

The debugging integration consists of:

1. **Debug Manager** - Central coordination service
2. **Debug Adapter Processes** - Individual debug adapter instances
3. **Protocol Handler** - Debug Adapter Protocol implementation
4. **Session Manager** - Debug session lifecycle management
5. **Frontend Integration** - Debugging interface

## Debugging Workflow

### Starting a Debug Session
1. Select file to debug
2. Choose appropriate language
3. Configure debug settings (if needed)
4. Start debug session
5. Set breakpoints
6. Begin execution

### During Debugging
1. Execution pauses at breakpoints
2. Inspect variables and call stack
3. Evaluate expressions
4. Step through code or continue execution
5. Modify variables (where supported)
6. Handle exceptions

### Ending Debug Session
1. Terminate execution
2. Clean up debug adapter processes
3. Close debug session
4. Review debug results

## Security Considerations

Debugging integration includes several security measures:

### Process Isolation
- Debug adapters run in separate processes
- Limited file system access
- Restricted network communication
- Resource usage monitoring

### Code Safety
- Debug sessions limited to project directories
- Input validation for debug commands
- Protection against malicious code execution
- Secure handling of debug data

### User Permissions
- User consent required for debug session start
- Permission checks for sensitive debugging operations
- Audit logging for all debug activities

## Troubleshooting

### Common Issues

1. **Debug adapter not found**
   - Ensure debug adapters are installed and accessible in PATH
   - Check that required dependencies are available
   - Restart the backend service after installing new adapters

2. **Breakpoint not hitting**
   - Verify that the file is saved and syntax is correct
   - Check that the breakpoint is set in executable code
   - Ensure debug symbols are available (for compiled languages)

3. **Variable inspection failures**
   - Some variables may not be accessible in current scope
   - Optimized code may limit variable visibility
   - Check debug adapter compatibility with code constructs

4. **Performance issues**
   - Debugging can slow down execution significantly
   - Large data structures may take time to inspect
   - Consider optimizing debug configurations

### Logs and Debugging

Enable debug logging to troubleshoot debugging issues:
```bash
# Set environment variable
export DEBUG_DEBUG=true
```

Check debug adapter logs:
```bash
# Debug adapter logs are typically available through the debug session
```

## Extending Support

To add support for additional languages:

1. Install the appropriate debug adapter
2. Add configuration to the debug manager
3. Update language mapping in the frontend
4. Test debugging with sample programs
5. Implement language-specific features

## Best Practices

### Debug Configuration
- Use appropriate debug configurations for each project
- Set meaningful breakpoint conditions
- Utilize watch expressions for complex debugging scenarios
- Configure exception breakpoints for error handling

### Performance Optimization
- Remove unnecessary breakpoints
- Use conditional breakpoints to limit hits
- Minimize variable inspection during performance-critical code
- Consider remote debugging for resource-intensive applications

### Security
- Only debug trusted code
- Limit debug sessions to project directories
- Use secure communication channels for remote debugging
- Regularly update debug adapters to latest versions

## Future Enhancements

Planned improvements include:
- Support for additional languages (C++, Java, etc.)
- Enhanced variable visualization
- Improved performance monitoring
- Better integration with testing frameworks
- Advanced debugging features (time-travel debugging, etc.)
- Remote debugging enhancements
- Profiling and memory analysis tools