# Git Integration

Open-Deep-Coder provides comprehensive Git integration through both Model Context Protocol (MCP) and n8n workflow automation, enabling seamless version control operations within the IDE.

## Overview

The Git integration supports two approaches for Git operations:
- **MCP-based operations** - Direct Git commands through MCP protocol
- **n8n-based automation** - Workflow automation for complex Git processes

This dual approach provides flexibility for different use cases while maintaining a consistent interface.

## Features

### Repository Management
- Repository status monitoring
- Branch creation and switching
- Remote repository management
- Tag management

### Commit Operations
- Staging and unstaging files
- Commit message generation
- Commit history browsing
- Diff analysis

### Remote Operations
- Push to remote repositories
- Pull from remote repositories
- Fetch operations
- Merge conflict resolution

### Automation Workflows
- Automated commit workflows
- Scheduled Git operations
- CI/CD integration
- Notification systems

## Setup and Configuration

### Prerequisites

1. **Git** - Installed and configured on the system
   ```bash
   # Check Git installation
   git --version
   
   # Configure Git user
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **MCP Git Server** (for direct operations)
   ```bash
   npm install -g @modelcontextprotocol/server-git
   ```

3. **n8n Server** (for workflow automation)
   - Running instance at `http://192.168.50.145:5678/`

### Configuration

Git integration is configured through the backend service:

```python
# Environment variables
GIT_MCP_ENABLED=true
N8N_GIT_WORKFLOWS_ENABLED=true
DEFAULT_GIT_REMOTE=origin
DEFAULT_GIT_BRANCH=main
```

## API Endpoints

The frontend communicates with the Git integration through these backend endpoints:

- `GET /api/git/status` - Get repository status
- `POST /api/git/commit` - Commit changes
- `POST /api/git/push` - Push to remote
- `POST /api/git/pull` - Pull from remote
- `POST /api/git/setup-automation` - Setup automated Git workflows
- `GET /api/git/log` - Get commit history
- `POST /api/git/branch` - Create/switch branches
- `POST /api/git/tag` - Create/manage tags

## Architecture

### MCP Integration
Direct Git operations through MCP protocol:
1. **Git MCP Server** - Handles Git commands
2. **MCP Manager** - Routes Git operations
3. **Permission System** - Controls Git access
4. **Frontend Interface** - Git operation UI

### n8n Integration
Workflow automation for Git operations:
1. **n8n Manager** - Coordinates workflows
2. **Git Workflows** - Predefined automation
3. **Execution Tracker** - Monitors workflow status
4. **Frontend Interface** - Workflow control UI

## Git Operations

### Status Monitoring
Real-time repository status:
- Modified files
- Staged files
- Untracked files
- Branch information
- Remote status

### Commit Workflow
Complete commit process:
1. File selection and staging
2. Commit message generation
3. Commit execution
4. Optional push to remote

### Branch Management
Branch operations:
- List branches
- Create new branches
- Switch branches
- Delete branches
- Merge branches

### Remote Operations
Remote repository management:
- Push changes
- Pull updates
- Fetch from remote
- Remote repository configuration

## Automation Features

### Automated Commit Workflows
Predefined workflows for common commit scenarios:
- **Feature Branch Workflow** - Create feature branch, commit changes, merge to main
- **Hotfix Workflow** - Create hotfix branch, commit fix, merge and tag
- **Release Workflow** - Prepare release, create tag, push to remote

### Scheduled Operations
Time-based Git operations:
- Daily status reports
- Weekly backup commits
- Monthly tag creation
- Custom schedule definitions

### CI/CD Integration
Integration with continuous integration:
- Automated testing triggers
- Deployment workflow activation
- Notification systems
- Status reporting

## Security Considerations

Git integration includes several security measures:

### Authentication
- Git credential management
- SSH key handling
- Access token security
- Secure credential storage

### Authorization
- Repository access controls
- Branch protection rules
- Operation permission checks
- Audit logging

### Data Protection
- Encryption of sensitive data
- Secure communication channels
- Input validation and sanitization
- Resource usage limits

## Troubleshooting

### Common Issues

1. **Repository not found**
   - Verify repository path is correct
   - Check Git repository initialization
   - Ensure proper file permissions
   - Validate remote repository access

2. **Commit failures**
   - Check for unmerged conflicts
   - Verify staged files
   - Review commit message format
   - Examine Git configuration

3. **Push/Pull issues**
   - Check network connectivity
   - Verify remote repository access
   - Review authentication credentials
   - Examine branch protection rules

4. **Performance issues**
   - Large repositories may take time to process
   - Network latency affects remote operations
   - Consider shallow clones for large histories
   - Optimize file staging process

### Logs and Debugging

Enable debug logging to troubleshoot Git issues:
```bash
# Set environment variable
export GIT_DEBUG=true
```

Check Git operation logs:
```bash
# View recent Git operations
git log --oneline -10
```

## Best Practices

### Repository Management
- Keep repositories organized and clean
- Use meaningful commit messages
- Follow branching strategies
- Regular backup and maintenance

### Commit Practices
- Make small, focused commits
- Write clear commit messages
- Stage related changes together
- Review changes before committing

### Branching Strategies
- Use feature branches for development
- Keep main branch stable
- Delete merged branches
- Use descriptive branch names

### Remote Operations
- Pull before pushing
- Handle conflicts promptly
- Use tags for releases
- Monitor remote repository status

## Extending Git Integration

To add new Git features:

1. **MCP Extensions**
   - Add new Git commands to MCP server
   - Update tool discovery registration
   - Implement frontend interface
   - Test with various Git scenarios

2. **n8n Workflow Extensions**
   - Create new workflow templates
   - Register workflows with n8n manager
   - Add workflow to available operations
   - Test workflow execution

3. **Custom Operations**
   - Define new Git operations
   - Implement backend handlers
   - Create frontend controls
   - Document new features

## Future Enhancements

Planned improvements include:
- Enhanced conflict resolution tools
- Advanced branching visualization
- Improved performance for large repositories
- Better integration with code review systems
- Support for additional Git hosting providers
- Advanced automation workflow capabilities
- Enhanced security features
- Better offline operation support