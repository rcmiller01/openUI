import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { AdvancedToolsDashboard } from '../AdvancedToolsDashboard';
import { lightLowTheme } from '../../../themes';

// Mock the child components to simplify testing
vi.mock('../ToolDiscovery', () => ({
  ToolDiscovery: () => <div data-testid="tool-discovery">Tool Discovery Component</div>
}));

vi.mock('../DebugPanel', () => ({
  DebugPanel: () => <div data-testid="debug-panel">Debug Panel Component</div>
}));

vi.mock('../LSPIntegration', () => ({
  LSPIntegration: () => <div data-testid="lsp-integration">LSP Integration Component</div>
}));

vi.mock('../N8NWorkflowManager', () => ({
  N8NWorkflowManager: () => <div data-testid="n8n-workflow">n8n Workflow Manager Component</div>
}));

vi.mock('../GitIntegration', () => ({
  GitIntegration: () => <div data-testid="git-integration">Git Integration Component</div>
}));

vi.mock('../AgentCoordination', () => ({
  AgentCoordination: () => <div data-testid="agent-coordination">Agent Coordination Component</div>
}));

// Test wrapper with theme provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightLowTheme}>
    {children}
  </ThemeProvider>
);

describe('AdvancedToolsDashboard', () => {
  test('renders without crashing', () => {
    render(
      <TestWrapper>
        <AdvancedToolsDashboard />
      </TestWrapper>
    );
    
    // Check that the main title is rendered
    expect(screen.getByText('Advanced Tools Dashboard')).toBeInTheDocument();
    
    // Check that the description is rendered
    expect(screen.getByText(/manage enhanced capabilities/i)).toBeInTheDocument();
  });

  test('renders all tab navigation buttons', () => {
    render(
      <TestWrapper>
        <AdvancedToolsDashboard />
      </TestWrapper>
    );
    
    // Check that all tab buttons are rendered
    expect(screen.getByText('🛠️ Tools')).toBeInTheDocument();
    expect(screen.getByText('🐛 Debug')).toBeInTheDocument();
    expect(screen.getByText('🔧 LSP')).toBeInTheDocument();
    expect(screen.getByText('🔄 n8n')).toBeInTheDocument();
    expect(screen.getByText('📚 Git')).toBeInTheDocument();
    expect(screen.getByText('🤖 Agents')).toBeInTheDocument();
  });

  test('renders the default active tab (ToolDiscovery)', () => {
    render(
      <TestWrapper>
        <AdvancedToolsDashboard />
      </TestWrapper>
    );
    
    // Check that the ToolDiscovery component is rendered by default
    expect(screen.getByTestId('tool-discovery')).toBeInTheDocument();
  });

  test('renders quick action buttons', () => {
    render(
      <TestWrapper>
        <AdvancedToolsDashboard />
      </TestWrapper>
    );
    
    // Check that quick action buttons are rendered
    expect(screen.getByText('Discover Tools')).toBeInTheDocument();
    expect(screen.getByText('Debug Code')).toBeInTheDocument();
    expect(screen.getByText('Git Operations')).toBeInTheDocument();
  });

  test('renders system status indicators', () => {
    render(
      <TestWrapper>
        <AdvancedToolsDashboard />
      </TestWrapper>
    );
    
    // Check that system status indicators are rendered
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Backend Connected')).toBeInTheDocument();
    expect(screen.getByText('Integrations Active')).toBeInTheDocument();
    expect(screen.getByText('Agents Ready')).toBeInTheDocument();
    expect(screen.getByText('Tools Available')).toBeInTheDocument();
  });
});