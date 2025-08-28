# Advanced Tools Dashboard

The Advanced Tools Dashboard provides a comprehensive interface for managing enhanced capabilities in Open-Deep-Coder, including debugging, language server integration, workflow automation, and agent coordination.

## Features

### 🛠️ Tool Discovery
Discover and manage all available tools across different integration systems:
- **LSP Tools**: Language server capabilities for code completion, hover info, and diagnostics
- **MCP Tools**: Model Context Protocol tools for extended AI capabilities
- **n8n Workflows**: Automated workflows for complex operations
- **Debug Tools**: Debugging capabilities for multiple languages
- **Native Tools**: Built-in file system and code execution tools

### 🐛 Debug Panel
Full-featured debugging interface with support for multiple languages:
- Start/stop debug sessions for Python, TypeScript, JavaScript, Rust, and Go
- Set breakpoints with conditions
- Variable inspection and evaluation
- Stack trace navigation
- Step execution controls (continue, step over, step into, step out)

### 🔧 LSP Integration
Language Server Protocol integration for enhanced coding experience:
- Real-time code completion
- Hover information with documentation
- Syntax error detection
- Support for Python, TypeScript, JavaScript, and Rust

### 🔄 n8n Workflow Manager
Workflow automation through n8n integration:
- Execute predefined workflows
- Git commit automation
- Custom workflow execution with data passing
- Workflow status monitoring

### 📚 Git Integration
Complete Git operations management:
- Repository status monitoring
- Commit changes via MCP or n8n workflows
- Push/pull operations
- Branch management
- File staging and selection

### 🤖 Agent Coordination
Multi-agent system management:
- Agent status monitoring
- Task submission with priority management
- Workflow orchestration
- Performance metrics and success rate tracking

## Usage

### Accessing the Dashboard
1. Open the sidebar by clicking the menu icon
2. Click on "Advanced Tools" in the sidebar
3. The dashboard will open in a modal window

### Navigating Features
Use the tab navigation at the top of the dashboard to switch between different tool categories:
- **Tools**: Discover and manage all available tools
- **Debug**: Start and control debugging sessions
- **LSP**: Test language server features
- **n8n**: Manage workflow automation
- **Git**: Perform Git operations
- **Agents**: Monitor and coordinate agents

### Quick Actions
The quick actions section at the bottom provides shortcuts to common operations:
- **Discover Tools**: Navigate to the tool discovery interface
- **Debug Code**: Open the debugging panel
- **Git Operations**: Access Git integration features

## Integration Details

### Language Server Protocol (LSP)
The LSP integration provides real-time coding assistance:
- **Requirements**: Install language servers on your system:
  - Python: `pip install python-lsp-server`
  - TypeScript/JavaScript: `npm install -g typescript-language-server`
  - Rust: `rustup component add rust-analyzer`

### Model Context Protocol (MCP)
MCP integration extends AI capabilities through specialized servers:
- **Git MCP**: Provides Git operations through AI
- **Filesystem MCP**: Enables filesystem operations through AI

### n8n Workflow Automation
n8n integration enables complex workflow automation:
- **Server**: Connects to n8n server at `http://192.168.50.145:5678/`
- **Workflows**: Execute predefined workflows for common operations
- **Git Automation**: Automated Git commit workflows

### Debug Adapter Protocol (DAP)
Debugging support for multiple languages:
- **Python**: Uses debugpy
- **TypeScript/JavaScript**: Uses Node.js inspector
- **Rust**: Uses rust-gdb
- **Go**: Uses Delve debugger

## API Endpoints

The frontend components communicate with the backend through these API endpoints:

### Tool Discovery
- `GET /api/tools` - Get all available tools
- `POST /api/tools/invoke` - Invoke a specific tool capability
- `GET /api/tools/analytics` - Get tool usage analytics

### Debugging
- `GET /api/debug/sessions` - Get debug session status
- `POST /api/debug/start` - Start a debug session
- `POST /api/debug/breakpoint` - Set a breakpoint
- Additional endpoints for variable inspection, stack traces, and execution control

### Language Server Protocol
- `GET /api/lsp/servers` - Get LSP server status
- `POST /api/lsp/completion` - Get code completion
- `POST /api/lsp/hover` - Get hover information

### n8n Integration
- `GET /api/n8n/workflows` - Get workflow status
- `POST /api/n8n/execute` - Execute a workflow
- `POST /api/n8n/git/commit` - Trigger Git commit workflow

### Git Operations
- `GET /api/git/status` - Get Git repository status
- `POST /api/git/commit` - Commit changes
- `POST /api/git/push` - Push changes
- `POST /api/git/pull` - Pull changes

### Agent Coordination
- `GET /api/coordination/status` - Get coordination system status
- `POST /api/coordination/task` - Submit a task
- `POST /api/coordination/workflow` - Submit a workflow

## Troubleshooting

### Common Issues

1. **Tools not appearing**: Ensure backend services are running and integrations are properly configured
2. **LSP features not working**: Verify language servers are installed and accessible in PATH
3. **n8n workflows not executing**: Check n8n server connectivity and workflow configurations
4. **Debug sessions failing**: Ensure debug adapters are installed for the target language

### Checking Integration Status
Use the development endpoints to verify integration status:
- `GET /api/dev/test-integrations` - Test all integrations
- `GET /health` - Check overall system health

## Extending the Dashboard

To add new tools or features to the dashboard:

1. Create a new React component in the `advanced` directory
2. Add the component to the tabs array in `AdvancedToolsDashboard.tsx`
3. Implement the necessary API endpoints in the backend
4. Add the tool to the ToolDiscovery system

The modular design makes it easy to extend with new capabilities while maintaining a consistent user experience.