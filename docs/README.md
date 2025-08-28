# Open-Deep-Coder Documentation

Welcome to the comprehensive documentation for Open-Deep-Coder, an agentic IDE with multi-agent coding workflow and advanced development tools integration.

## Table of Contents

### Getting Started
- [Quickstart Guide](../README.md#quickstart) - Setup and initial configuration
- [Core Features](../README.md#core-features) - Overview of main capabilities
- [Architecture](../README.md#architecture) - System design and components

### Integration Guides

1. [Language Server Protocol (LSP)](LSP_INTEGRATION.md)
   - Code completion and intelligent assistance
   - Supported languages and setup
   - Troubleshooting and performance optimization

2. [Model Context Protocol (MCP)](MCP_INTEGRATION.md)
   - AI-enhanced tools and context
   - Git and filesystem operations
   - Security and permission management

3. [n8n Workflow Automation](N8N_INTEGRATION.md)
   - Workflow execution and management
   - Git automation workflows
   - Custom workflow creation

4. [Debugging Integration](DEBUGGING.md)
   - Multi-language debugging support
   - Breakpoint management and variable inspection
   - Performance and security considerations

5. [Git Integration](GIT_INTEGRATION.md)
   - Repository management and operations
   - MCP vs n8n approaches
   - Automation and CI/CD integration

6. [Agent Coordination](AGENT_COORDINATION.md)
   - Multi-agent system architecture
   - Task management and workflow orchestration
   - Performance monitoring and optimization

7. [Tool Discovery](TOOL_DISCOVERY.md)
   - Unified tool access across systems
   - Dynamic discovery and registration
   - Usage analytics and performance tracking

### Master Guides

8. [Complete Integration Guide](INTEGRATION_GUIDE.md)
   - Comprehensive overview of all capabilities
   - Setup and configuration
   - Best practices and troubleshooting

9. [API Documentation](API_DOCUMENTATION.md)
   - Complete API endpoint reference
   - Request/response examples
   - WebSocket interface

10. [Quickstart: Enhanced Integrations](QUICKSTART_INTEGRATIONS.md)
    - Step-by-step setup guide
    - Testing and verification
    - Troubleshooting common issues

### Frontend Development
- [Advanced Tools Dashboard](../frontend/src/components/advanced/README.md)
  - Component overview and usage
  - Feature navigation and quick actions
  - API endpoint integration

### API Documentation
- [Backend API](../backend/main.py) - REST API endpoints and usage
- [WebSocket Interface](../backend/main.py) - Real-time communication
- [Development Endpoints](../backend/main.py) - Testing and debugging APIs

### Development Guides
- [Contributing](../CONTRIBUTING.md) - How to contribute to the project
- [Code Quality Standards](../README.md#quality-standards) - Testing, formatting, and security
- [Project Structure](../README.md#project-structure) - Code organization and conventions

### Testing and Quality
- [Test Framework](../test_enhanced_backend.py) - Backend integration testing
- [Frontend Testing](../frontend/src/components/advanced/__tests__/AdvancedToolsDashboard.test.tsx) - Component testing
- [CI/CD Pipeline](../.github/workflows/ci.yml) - Automated testing and deployment

### Security
- [Security Guidelines](../SECURITY.md) - Best practices and compliance
- [Permission System](../backend/main.py) - Access control and user consent
- [Audit Logging](../backend/main.py) - Activity tracking and monitoring

## System Requirements

### Backend
- Python 3.9+
- FastAPI
- Required integration tools (LSP servers, MCP servers, etc.)

### Frontend
- Node.js 18+
- Modern web browser
- Monaco Editor

### Optional Integrations
- OpenRouter API key for remote LLM access
- Ollama for local LLM support
- n8n server for workflow automation
- Git for version control

## Support and Community

### Getting Help
- [GitHub Issues](https://github.com/rcmiller01/openUI/issues) - Bug reports and feature requests
- [Documentation](docs/) - Comprehensive guides and API references
- [Community Discord](#) - Real-time discussion and support (coming soon)

### Contributing
We welcome contributions from the community:
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

*Open-Deep-Coder: Transforming software development through intelligent agent coordination.*