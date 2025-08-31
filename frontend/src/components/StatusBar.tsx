import styled from 'styled-components';
import { useAppStore } from '@/store';

const StatusBarContainer = styled.div`
  height: 24px;
  background-color: ${props => props.theme.colors.bg.tertiary};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ThemeButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

export default function StatusBar() {
  const { 
    theme, 
    setTheme, 
    selectedModel, 
    isLocalMode, 
    toggleLocalMode,
    activeFile,
    agents,
    isChatPanelOpen,
    toggleChatPanel
  } = useAppStore();

  const runningAgents = Object.values(agents).filter(agent => agent.status === 'running').length;

  const toggleTheme = () => {
    const themes = ['light-low', 'light-high', 'dark-low', 'dark-high'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeDisplayName = (theme: string) => {
    const names = {
      'light-low': 'Light',
      'light-high': 'Light HC',
      'dark-low': 'Dark',
      'dark-high': 'Dark HC'
    };
    return names[theme as keyof typeof names] || theme;
  };

  return (
    <StatusBarContainer>
      <StatusLeft>
        <StatusItem>
          📁 {activeFile ? activeFile.split('/').pop() : 'No file'}
        </StatusItem>
        
        {runningAgents > 0 && (
          <StatusItem>
            🤖 {runningAgents} agent{runningAgents > 1 ? 's' : ''} running
          </StatusItem>
        )}
      </StatusLeft>

      <StatusRight>
        <StatusItem onClick={toggleLocalMode}>
          {isLocalMode ? '🏠 Local' : '☁️ Remote'}
        </StatusItem>
        
        <StatusItem onClick={toggleChatPanel}>
          💬 Chat {isChatPanelOpen ? '(Open)' : '(Closed)'}
        </StatusItem>
        
        <StatusItem>
          🧠 {selectedModel || 'Auto'}
        </StatusItem>
        
        <ThemeButton onClick={toggleTheme}>
          🎨 {getThemeDisplayName(theme)}
        </ThemeButton>
        
        <StatusItem>
          Open-Deep-Coder v0.1.0
        </StatusItem>
      </StatusRight>
    </StatusBarContainer>
  );
}