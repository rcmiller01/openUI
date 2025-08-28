# n8n Workflow Integration

Open-Deep-Coder integrates with n8n to provide powerful workflow automation capabilities for development processes, CI/CD operations, and complex multi-step tasks.

## Overview

The n8n integration enables automated workflows for common development tasks including:
- Git operations automation
- Code review processes
- Testing and deployment pipelines
- Notification systems
- Data processing workflows

## Setup and Configuration

### Prerequisites

1. **n8n Server** - Running instance of n8n
   - Default endpoint: `http://192.168.50.145:5678/`
   - Can be configured through environment variables

2. **Workflow Templates** - Predefined workflows for common operations

### Configuration

The n8n integration is configured through the backend service:

```python
# Environment variables
N8N_URL=http://192.168.50.145:5678/
N8N_API_KEY=your_api_key_here  # Optional, for authenticated endpoints
```

## Features

### Workflow Execution
Execute predefined workflows with custom parameters:
- Manual workflow triggering
- Parameterized workflow execution
- Execution status monitoring
- Result retrieval and processing

### Git Automation
Automated Git operations through workflows:
- Automated commit messages
- Branch management workflows
- Pull request automation
- Code review workflows

### CI/CD Integration
Development pipeline automation:
- Automated testing workflows
- Deployment automation
- Environment provisioning
- Rollback procedures

### Custom Workflows
Create and execute custom workflows for specific needs:
- Multi-step processes
- Conditional logic
- Error handling and recovery
- Parallel execution

## API Endpoints

The frontend communicates with the n8n integration through these backend endpoints:

- `GET /api/n8n/workflows` - Get status of all n8n workflows
- `POST /api/n8n/execute` - Execute an n8n workflow with parameters
- `POST /api/n8n/git/commit` - Trigger Git commit workflow
- `POST /api/git/setup-automation` - Setup automated Git workflows

## Architecture

The n8n integration consists of:

1. **n8n Manager** - Central coordination service
2. **HTTP Client** - Communication with n8n REST API
3. **Workflow Registry** - Workflow template management
4. **Execution Tracker** - Workflow execution monitoring
5. **Frontend Integration** - Workflow interface

## Predefined Workflows

### Git Commit Workflow
Automated Git commit process:
1. Stage specified files
2. Generate commit message based on changes
3. Create commit with appropriate metadata
4. Push to remote repository (optional)

### Code Review Workflow
Automated code review process:
1. Analyze code changes
2. Run static analysis tools
3. Generate review comments
4. Post review to appropriate system

### Testing Workflow
Automated testing process:
1. Set up test environment
2. Run unit tests
3. Run integration tests
4. Generate test reports
5. Post results to notification systems

## Security Considerations

n8n integration includes several security measures:

### Authentication
- API key authentication for n8n endpoints
- Secure storage of credentials
- Role-based access control

### Authorization
- User consent for workflow execution
- Permission checks for sensitive operations
- Audit logging for all workflow executions

### Data Protection
- Encryption of sensitive data in transit
- Secure handling of workflow parameters
- Isolation of workflow execution environments

## Troubleshooting

### Common Issues

1. **Connection failures**
   - Verify n8n server is running and accessible
   - Check network connectivity to n8n endpoint
   - Validate API key and authentication

2. **Workflow execution failures**
   - Check workflow configuration in n8n
   - Review execution logs for error details
   - Verify required resources are available

3. **Performance issues**
   - Large workflows may take time to execute
   - Network latency can affect remote workflows
   - Consider optimizing workflow complexity

### Logs and Debugging

Enable debug logging to troubleshoot n8n issues:
```bash
# Set environment variable
export N8N_DEBUG=true
```

Check n8n execution logs:
```bash
# In n8n interface
# Go to Executions tab for workflow details
```

## Extending Workflows

To create custom workflows:

1. **Design in n8n Interface**
   - Use n8n web interface to create workflow
   - Test workflow with sample data
   - Export workflow as JSON template

2. **Register in Backend**
   - Add workflow template to n8n manager
   - Define required parameters
   - Set up execution triggers

3. **Integrate with Frontend**
   - Add workflow to available workflows list
   - Create UI for parameter input
   - Implement execution monitoring

## Best Practices

### Workflow Design
- Keep workflows focused on single responsibilities
- Use error handling and recovery mechanisms
- Implement proper logging and monitoring
- Design for idempotency where possible

### Performance Optimization
- Minimize external API calls
- Use caching for frequently accessed data
- Implement parallel processing where appropriate
- Monitor resource usage and optimize accordingly

### Security
- Validate all input parameters
- Use least privilege principles for API keys
- Implement proper error handling to avoid information leakage
- Regularly audit workflow permissions and access

## Future Enhancements

Planned improvements include:
- Enhanced workflow template management
- Improved error handling and recovery
- Better performance monitoring and optimization
- Advanced caching mechanisms
- Integration with more n8n node types
- Support for workflow versioning
- Enhanced workflow scheduling capabilities