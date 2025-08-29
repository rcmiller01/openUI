import { useState } from 'react';
import styled from 'styled-components';
import { useAppStore } from '../store';
import { AgentType, AgentStatus as AgentStatusType } from '../store';

const AgentPanelContainer = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '300px' : '40px'};
  height: 100%;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-left: 1px solid ${props => props.theme.colors.border.primary};
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PanelTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const AgentList = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const AgentCard = styled.div`
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.accent};
  }
`;

const AgentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const AgentName = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  text-transform: capitalize;
`;

const StatusIndicator = styled.div<{ status: AgentStatusType }>`
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
`;

const AgentTask = styled.div`
  font-size: 11px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 6px;
  min-height: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${props => props.theme.colors.ui.disabled};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: ${props => props.theme.colors.text.accent};
  transition: width 0.3s ease;
`;

const AgentControls = styled.div`
  display: flex;
  gap: 4px;
`;

const ControlButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return props.theme.colors.text.accent;
      case 'danger': return props.theme.colors.text.error;
      default: return props.theme.colors.ui.disabled;
    }
  }};
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GlobalControls = styled.div`
  padding: 12px;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  gap: 8px;
`;

const GlobalButton = styled.button<{ variant?: 'danger' }>`
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${props => 
    props.variant === 'danger' 
      ? props.theme.colors.text.error 
      : props.theme.colors.text.accent
  };
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
`;

export default function AgentPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const { agents, runAgent, stopAgent, stopAllAgents } = useAppStore();

  const agentTypes: AgentType[] = [
    'orchestrator',
    'planner', 
    'implementer',
    'verifier',
    'reviewer',
    'researcher'
  ];

  const getAgentIcon = (type: AgentType) => {
    const icons = {
      orchestrator: '🎯',
      planner: '📋',
      implementer: '⚡',
      verifier: '✅',
      reviewer: '🔍',
      researcher: '🔬'
    };
    return icons[type as keyof typeof icons];
  };

  const getAgentDescription = (type: AgentType) => {
    const descriptions = {
      orchestrator: 'Coordinates agent workflow',
      planner: 'Analyzes and plans tasks',
      implementer: 'Generates and modifies code',
      verifier: 'Runs tests and quality checks',
      reviewer: 'Reviews code for security',
      researcher: 'Looks up documentation'
    };
    return descriptions[type as keyof typeof descriptions];
  };

  const handleRunAgent = (type: AgentType) => {
    const task = prompt(`Enter task for ${type}:`);
    if (task) {
      runAgent(type, task);
    }
  };

  const formatProgress = (progress?: number) => {
    return progress ? Math.round(progress * 100) : 0;
  };

  return (
    <AgentPanelContainer isOpen={isOpen}>
      <PanelHeader>
        {isOpen && <PanelTitle>Agents</PanelTitle>}
        <ToggleButton onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '→' : '←'}
        </ToggleButton>
      </PanelHeader>

      {isOpen && (
        <>
          <AgentList>
            {agentTypes.map((type) => {
              const agent = agents[type];
              return (
                <AgentCard key={type}>
                  <AgentHeader>
                    <AgentName>
                      {getAgentIcon(type)} {type}
                    </AgentName>
                    <StatusIndicator status={agent.status} />
                  </AgentHeader>
                  
                  <AgentTask>
                    {agent.currentTask || getAgentDescription(type)}
                  </AgentTask>
                  
                  {agent.progress !== undefined && (
                    <ProgressBar>
                      <ProgressFill progress={formatProgress(agent.progress)} />
                    </ProgressBar>
                  )}
                  
                  <AgentControls>
                    <ControlButton
                      variant="primary"
                      onClick={() => handleRunAgent(type)}
                      disabled={agent.status === 'running'}
                    >
                      Run
                    </ControlButton>
                    <ControlButton
                      variant="danger"
                      onClick={() => stopAgent(type)}
                      disabled={agent.status === 'idle'}
                    >
                      Stop
                    </ControlButton>
                  </AgentControls>
                  
                  {agent.error && (
                    <div style={{
                      fontSize: '11px',
                      color: '#f44336',
                      marginTop: '6px',
                      padding: '4px',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      borderRadius: '4px'
                    }}>
                      {agent.error}
                    </div>
                  )}
                </AgentCard>
              );
            })}
          </AgentList>

          <GlobalControls>
            <GlobalButton onClick={() => {
              // Run orchestrator to coordinate all agents
              runAgent('orchestrator', 'Coordinate full workflow');
            }}>
              Run All
            </GlobalButton>
            <GlobalButton 
              variant="danger"
              onClick={stopAllAgents}
            >
              Stop All
            </GlobalButton>
          </GlobalControls>
        </>
      )}
    </AgentPanelContainer>
  );
}