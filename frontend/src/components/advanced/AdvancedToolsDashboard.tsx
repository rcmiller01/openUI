import React, { useState } from 'react';
import styled from 'styled-components';
import { ToolDiscovery } from './ToolDiscovery';
import { DebugPanel } from './DebugPanel';
import { LSPIntegration } from './LSPIntegration';
import { N8NWorkflowManager } from './N8NWorkflowManager';
import { GitIntegration } from './GitIntegration';
import { AgentCoordination } from './AgentCoordination';
import { ProxmoxContainerManager } from './ProxmoxContainerManager';

const Container = styled.div`
  width: 100%;
  color: ${props => props.theme.colors.text.primary};
  background: ${props => props.theme.colors.bg.secondary};
  padding: 20px;
  border-radius: 8px;
`;

const Header = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0 0 8px 0;
  color: ${props => props.theme.colors.text.primary};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.muted};
`;

const Tabs = styled.nav`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding-bottom: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
`;

const TabButton = styled.button<{active?: boolean}>`
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: ${props => props.active ? props.theme.colors.text.accent : props.theme.colors.text.secondary};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.text.accent : 'transparent'};
  cursor: pointer;
`;

const Content = styled.div`
  margin-top: 12px;
`;

const QuickActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

const ActionCard = styled.button`
  flex: 1;
  background: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  padding: 12px;
  border-radius: 8px;
  color: ${props => props.theme.colors.text.primary};
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatusGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const StatusCard = styled.div`
  background: ${props => props.theme.colors.bg.primary};
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  color: ${props => props.theme.colors.text.primary};
`;

const ActionIcon = styled.div`
  font-size: 18px;
`;

const ActionTitle = styled.div`
  font-weight: 600;
`;

const ActionSubtitle = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 12px;
`;

const StatusIcon = styled.div`
  font-size: 20px;
  margin-bottom: 6px;
`;

export const AdvancedToolsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tools');

  const tabs = [
    { id: 'tools', label: '🛠️ Tools', component: <ToolDiscovery /> },
    { id: 'debug', label: '🐛 Debug', component: <DebugPanel /> },
    { id: 'lsp', label: '🔧 LSP', component: <LSPIntegration /> },
    { id: 'n8n', label: '🔄 n8n', component: <N8NWorkflowManager /> },
    { id: 'git', label: '📚 Git', component: <GitIntegration /> },
    { id: 'agents', label: '🤖 Agents', component: <AgentCoordination /> },
    { id: 'containers', label: '🐳 Containers', component: <ProxmoxContainerManager /> }
  ];

  return (
    <Container>
      <Header>
        <Title>Advanced Tools Dashboard</Title>
        <Subtitle>Manage enhanced capabilities including debugging, language servers, workflow automation, and agent coordination.</Subtitle>
      </Header>

      <Tabs>
        {tabs.map((tab) => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </Tabs>

      <Content>
        {tabs.find(tab => tab.id === activeTab)?.component}
      </Content>

      <QuickActions>
        <ActionCard onClick={() => setActiveTab('tools')}>
          <ActionIcon>🛠️</ActionIcon>
          <ActionTitle>Discover Tools</ActionTitle>
          <ActionSubtitle>Explore available capabilities</ActionSubtitle>
        </ActionCard>

        <ActionCard onClick={() => setActiveTab('debug')}>
          <ActionIcon>🐛</ActionIcon>
          <ActionTitle>Debug Code</ActionTitle>
          <ActionSubtitle>Start debugging sessions</ActionSubtitle>
        </ActionCard>

        <ActionCard onClick={() => setActiveTab('containers')}>
          <ActionIcon>🐳</ActionIcon>
          <ActionTitle>Container Manager</ActionTitle>
          <ActionSubtitle>Manage Proxmox containers</ActionSubtitle>
        </ActionCard>
      </QuickActions>

      <StatusGrid>
        <StatusCard>
          <StatusIcon>✅</StatusIcon>
          <div>Backend Connected</div>
        </StatusCard>
        <StatusCard>
          <StatusIcon>🔄</StatusIcon>
          <div>Integrations Active</div>
        </StatusCard>
        <StatusCard>
          <StatusIcon>🤖</StatusIcon>
          <div>Agents Ready</div>
        </StatusCard>
        <StatusCard>
          <StatusIcon>🔧</StatusIcon>
          <div>Tools Available</div>
        </StatusCard>
      </StatusGrid>
    </Container>
  );
};