# Language Server Protocol (LSP) Integration

Open-Deep-Coder provides comprehensive Language Server Protocol integration to enhance the coding experience with real-time assistance and intelligent features.

## Overview

The LSP integration enables advanced code intelligence features including:
- Real-time code completion
- Hover information with documentation
- Syntax error detection and diagnostics
- Code navigation (go to definition, find references)
- Refactoring support
- Formatting and linting

## Supported Languages

The system currently supports LSP servers for:
- **Python** - Using `python-lsp-server` (pylsp)
- **TypeScript/JavaScript** - Using `typescript-language-server`
- **Rust** - Using `rust-analyzer`

## Setup and Configuration

### Prerequisites

Install the required language servers on your system:

#### Python
```bash
pip install python-lsp-server
```

#### TypeScript/JavaScript
```bash
npm install -g typescript-language-server
```

#### Rust
```bash
rustup component add rust-analyzer
```

### Configuration

The LSP manager automatically detects available language servers on startup. Configuration is handled through the backend service.

## Features

### Code Completion
Intelligent code completion suggestions based on context and language semantics.

### Hover Information
Detailed information about symbols, including type signatures and documentation.

### Diagnostics
Real-time syntax and semantic error detection with inline highlighting.

### Code Navigation
- Go to definition
- Find all references
- Peek definition
- Symbol search

### Refactoring
- Rename symbols
- Extract functions/variables
- Organize imports

## API Endpoints

The frontend communicates with the LSP integration through these backend endpoints:

- `GET /api/lsp/servers` - Get status of all LSP servers
- `POST /api/lsp/completion` - Get code completion at cursor position
- `POST /api/lsp/hover` - Get hover information at cursor position

## Architecture

The LSP integration consists of:

1. **LSP Manager** - Central coordination service
2. **Language Server Processes** - Individual LSP server instances
3. **Communication Layer** - JSON-RPC protocol handling
4. **Frontend Integration** - Monaco editor connection

## Troubleshooting

### Common Issues

1. **Language servers not detected**
   - Ensure language servers are installed and accessible in PATH
   - Restart the backend service after installing new servers

2. **Completion/hover not working**
   - Check that the file is saved with the correct extension
   - Verify that the language server is running for that file type

3. **Performance issues**
   - Large projects may cause delays in LSP responses
   - Consider excluding large directories from analysis

### Logs and Debugging

Enable debug logging to troubleshoot LSP issues:
```bash
# Set environment variable
export LSP_DEBUG=true
```

## Extending Support

To add support for additional languages:

1. Install the appropriate language server
2. Add configuration to the LSP manager
3. Update language mapping in the frontend
4. Test integration with sample files

## Performance Considerations

- Language servers run as separate processes to avoid blocking the main application
- Communication uses efficient JSON-RPC protocol
- Servers are started on-demand and stopped when not needed
- Memory usage is monitored and managed automatically

## Security

- Language servers run with limited permissions
- File system access is restricted to project directories
- Network communication is limited to localhost
- Input validation is performed on all LSP requests

## Future Enhancements

Planned improvements include:
- Support for additional languages (Go, C++, Java)
- Enhanced refactoring capabilities
- Workspace symbol search
- Code lens features
- Signature help
- Document formatting on save