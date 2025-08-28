import React from 'react';
import styled from 'styled-components';
import { Agent } from '@store';

const IndicatorContainer = styled.div`
  padding: 8px 12px;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  background-color: ${props => props.theme.colors.bg.tertiary};
`;

const IndicatorTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const AgentIndicators = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const AgentDot = styled.div<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'running': return '#4caf50';
      case 'success': return '#2196f3';
      case 'error': return '#f44336';
      case 'paused': return '#ff9800';
      default: return props.theme.colors.text.muted;
    }
  }};
  title: ${props => props.title};
`;

interface AgentStatusIndicatorProps {
  agents: Record<string, Agent>;
}

export default function AgentStatusIndicator({ agents }: AgentStatusIndicatorProps) {
  const agentEntries = Object.entries(agents);

  return (
    <IndicatorContainer>
      <IndicatorTitle>Agents</IndicatorTitle>
      <AgentIndicators>
        {agentEntries.map(([type, agent]) => (
          <AgentDot
            key={type}
            status={agent.status}
            title={`${type}: ${agent.status}${agent.currentTask ? ` - ${agent.currentTask}` : ''}`}
          />
        ))}
      </AgentIndicators>
    </IndicatorContainer>
  );
}