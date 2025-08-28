import React from 'react';
import styled from 'styled-components';
import { useAppStore, Agent } from '@store';

const StatusContainer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  background-color: ${props => props.theme.colors.bg.tertiary};
`;

const StatusTitle = styled.h4`
  font-size: 11px;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const AgentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AgentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const AgentName = styled.span`
  font-size: 11px;
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  text-transform: capitalize;
`;

const StatusBadge = styled.span<{ status: string }>`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'running': return '#4CAF50';
      case 'success': return '#8BC34A';
      case 'error': return '#F44336';
      case 'paused': return '#FF9800';
      default: return props.theme.colors.ui.hover;
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'idle': return props.theme.colors.text.secondary;
      default: return 'white';
    }
  }} ;
`;

const TaskInfo = styled.div`
  font-size: 10px;
  color: ${props => props.theme.colors.text.muted};
  margin-top: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 150px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 2px;
  background-color: ${props => props.theme.colors.border.primary};
  border-radius: 1px;
  overflow: hidden;
  margin-top: 4px;

  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background-color: ${props => props.theme.colors.text.accent};
    transition: width 0.3s ease;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 4px 6px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface AgentStatusIndicatorProps {
  agents: Record<string, Agent>;
}

export default function AgentStatusIndicator({ agents }: AgentStatusIndicatorProps) {
  const { runAgent, stopAllAgents } = useAppStore();

  const agentEntries = Object.entries(agents);
  const runningAgents = agentEntries.filter(([_, agent]) => agent.status === 'running');
  const hasRunningAgents = runningAgents.length > 0;

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'orchestrator': return '🎯';
      case 'planner': return '📋';
      case 'implementer': return '⚡';
      case 'verifier': return '✅';
      case 'reviewer': return '🔍';
      case 'researcher': return '🔬';
      default: return '🤖';
    }
  };

  const handleQuickPlan = () => {
    runAgent('planner', 'Analyze current codebase and create development plan');
  };

  const handleQuickImplement = () => {
    runAgent('implementer', 'Implement pending tasks from the plan');
  };

  return (
    <StatusContainer>
      <StatusTitle>Agent Status</StatusTitle>

      <AgentList>
        {agentEntries.map(([type, agent]) => (
          <AgentItem key={type}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{getAgentIcon(type)}</span>
                <AgentName>{type}</AgentName>
                <StatusBadge status={agent.status}>
                  {agent.status}
                </StatusBadge>
              </div>

              {agent.currentTask && (
                <TaskInfo title={agent.currentTask}>
                  {agent.currentTask}
                </TaskInfo>
              )}

              {agent.progress !== undefined && agent.status === 'running' && (
                <ProgressBar progress={agent.progress * 100} />
              )}
            </div>
          </AgentItem>
        ))}
      </AgentList>

      <QuickActions>
        <ActionButton
          onClick={handleQuickPlan}
          disabled={hasRunningAgents}
          title="Run planner agent"
        >
          📋 Plan
        </ActionButton>
        <ActionButton
          onClick={handleQuickImplement}
          disabled={hasRunningAgents}
          title="Run implementer agent"
        >
          ⚡ Code
        </ActionButton>
        <ActionButton
          onClick={stopAllAgents}
          disabled={!hasRunningAgents}
          title="Stop all running agents"
        >
          ⏹️ Stop
        </ActionButton>
      </QuickActions>
    </StatusContainer>
  );
}
