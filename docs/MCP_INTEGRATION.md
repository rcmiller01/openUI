# Model Context Protocol (MCP) Integration

Open-Deep-Coder implements the Model Context Protocol (MCP) to extend AI capabilities through specialized context servers that provide domain-specific knowledge and tools.

## Overview

The MCP integration enables AI models to access specialized tools and context through standardized protocol servers. This allows for enhanced capabilities beyond basic text generation, including file system operations, Git operations, and more.

## Supported MCP Servers

The system currently supports these MCP servers:

### Git MCP Server
Provides Git operations through natural language commands:
- Repository status
- Commit changes
- Push/pull operations
- Branch management
- Diff analysis

### Filesystem MCP Server
Enables filesystem operations:
- File reading and writing
- Directory listing and navigation
- File metadata operations
- Path resolution

## Setup and Configuration

### Prerequisites

Install the required MCP servers:

#### Git MCP Server
```bash
npm install -g @modelcontextprotocol/server-git
```

#### Filesystem MCP Server
```bash
npm install -g @modelcontextprotocol/server-filesystem
```

### Configuration

MCP servers are configured in the backend service. The system automatically discovers and connects to available servers.

## Features

### Git Operations
Natural language Git commands:
- "Show me the status of my repository"
- "Commit all changes with message 'Update documentation'"
- "Push to origin main branch"
- "Create a new branch called 'feature/new-ui'"

### Filesystem Access
AI-assisted file operations:
- "Read the contents of config.json"
- "List all Python files in the src directory"
- "Create a new file called README.md"
- "Get metadata for package.json"

### Tool Discovery
Automatic discovery of available MCP tools:
- Dynamic tool registration
- Capability reporting
- Tool invocation with parameters

## API Endpoints

The frontend communicates with the MCP integration through these backend endpoints:

- `GET /api/mcp/servers` - Get status of all MCP servers
- `GET /api/mcp/tools` - Get available MCP tools
- `POST /api/mcp/invoke` - Invoke an MCP tool with parameters
- `GET /api/git/status` - Get Git repository status (via MCP)
- `POST /api/git/commit` - Commit changes (via MCP)

## Architecture

The MCP integration consists of:

1. **MCP Manager** - Central coordination service
2. **MCP Server Processes** - Individual MCP server instances
3. **Protocol Handler** - JSON-RPC protocol implementation
4. **Tool Registry** - Dynamic tool discovery and management
5. **Frontend Integration** - Tool invocation interface

## Security Considerations

MCP integration includes several security measures:

### Permission System
- User consent required for sensitive operations
- Granular permission controls for different tool categories
- Audit logging for all MCP tool invocations

### Sandboxing
- MCP servers run with restricted file system access
- Network communication is limited and monitored
- Resource usage is capped to prevent abuse

### Input Validation
- All parameters are validated before passing to MCP servers
- Command injection protection for shell commands
- Path traversal prevention for file operations

## Troubleshooting

### Common Issues

1. **MCP servers not connecting**
   - Ensure MCP servers are installed and accessible in PATH
   - Check that required dependencies are available
   - Restart the backend service after installing new servers

2. **Tool invocation failures**
   - Verify that the tool exists and is properly registered
   - Check parameter validation errors in logs
   - Ensure required resources are available

3. **Performance issues**
   - Some MCP operations may take time for large repositories
   - Network latency can affect remote MCP servers
   - Consider caching frequently accessed data

### Logs and Debugging

Enable debug logging to troubleshoot MCP issues:
```bash
# Set environment variable
export MCP_DEBUG=true
```

## Extending Support

To add support for additional MCP servers:

1. Install the MCP server package
2. Add configuration to the MCP manager
3. Register tools with the tool discovery system
4. Test integration with sample operations

## Future Enhancements

Planned improvements include:
- Support for additional MCP server types
- Enhanced tool chaining and composition
- Improved error handling and recovery
- Better performance monitoring and optimization
- Advanced caching mechanisms
- Integration with more specialized MCP servers