# Quickstart: Enhanced Integrations

This guide provides a quick walkthrough to get you started with all the enhanced integration capabilities in Open-Deep-Coder.

## Prerequisites

Before setting up the integrations, ensure you have:

1. **Basic Setup Complete**:
   - Python 3.9+ with pip
   - Node.js 18+ with npm
   - Git for version control

2. **Core Services Running**:
   - Backend server at `http://127.0.0.1:8000`
   - Frontend application at `http://localhost:1420`

## 1. Language Server Protocol (LSP)

### Setup
Install language servers for your preferred languages:

```bash
# Python
pip install python-lsp-server

# TypeScript/JavaScript
npm install -g typescript-language-server

# Rust
rustup component add rust-analyzer

# Go
go install golang.org/x/tools/gopls@latest
```

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "LSP" tab
3. Test code completion by creating a new file with any supported language
4. Start typing to see real-time completions and diagnostics

## 2. Model Context Protocol (MCP)

### Setup
Install MCP servers:

```bash
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-filesystem
```

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "Tools" tab
3. Look for MCP tools in the discovery list
4. Test Git operations through the "Git" tab using MCP backend

## 3. n8n Workflow Automation

### Setup
Ensure your n8n server is running at `http://192.168.50.145:5678/`

If you need to set up n8n locally:
```bash
npm install n8n -g
n8n
```

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "n8n" tab
3. View available workflows
4. Execute a workflow by clicking the "Execute" button
5. Test Git automation by filling in the commit form and clicking "Commit via n8n"

## 4. Debugging Support

### Setup
Install debug adapters for your preferred languages:

```bash
# Python
pip install debugpy

# TypeScript/JavaScript (built into Node.js)

# Rust (requires GDB)
# Install GDB on your system

# Go (Delve is included with Go tools)
```

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "Debug" tab
3. Start a debug session by selecting a file and language
4. Set breakpoints by clicking on line numbers
5. Use the debug controls to step through execution

## 5. Git Integration

### Setup
Ensure Git is installed and configured:
```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "Git" tab
3. View repository status
4. Stage files and commit changes
5. Test both MCP and n8n Git operations

## 6. Agent Coordination

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "Agents" tab
3. View agent status and performance metrics
4. Submit tasks using the task submission form
5. Monitor task execution in real-time

## 7. Tool Discovery

### Usage
1. Open the Advanced Tools Dashboard
2. Navigate to the "Tools" tab by default
3. Browse all available tools across all integration systems
4. Search for specific tools using the search bar
5. View tool analytics and usage statistics

## Testing Your Setup

To verify all integrations are working correctly:

1. **Run Integration Tests**:
   ```bash
   cd backend
   python test_enhanced_backend.py
   ```

2. **Check Health Endpoint**:
   ```bash
   curl http://127.0.0.1:8000/health
   ```

3. **Test in UI**:
   - Open the Advanced Tools Dashboard
   - Visit each tab and perform a basic operation
   - Check that all components load without errors

## Troubleshooting

### Common Issues

1. **Tools not appearing**:
   - Check that backend services are running
   - Verify integration tool installations
   - Restart the backend server

2. **LSP features not working**:
   - Ensure language servers are in PATH
   - Check language server logs
   - Test language servers from command line

3. **n8n workflows not executing**:
   - Verify n8n server connectivity
   - Check n8n server logs
   - Test workflows in n8n web interface

4. **Debug sessions failing**:
   - Ensure debug adapters are installed
   - Check debug adapter compatibility
   - Test debug adapters independently

### Getting Help

If you encounter issues:

1. Check the detailed logs in the terminal where the backend is running
2. Review the specific integration guides in the [docs](./) directory
3. Visit the [API Documentation](API_DOCUMENTATION.md) for endpoint details
4. Refer to the [Integration Guide](INTEGRATION_GUIDE.md) for comprehensive information

## Next Steps

After setting up the integrations, explore:

1. **Advanced Features**:
   - Create custom n8n workflows
   - Configure complex debugging scenarios
   - Set up automated Git operations

2. **Performance Optimization**:
   - Review tool analytics
   - Optimize frequently used workflows
   - Configure caching for better performance

3. **Security Configuration**:
   - Set up proper access controls
   - Configure audit logging
   - Review permission settings

---

*Open-Deep-Coder: Transforming software development through intelligent agent coordination.*