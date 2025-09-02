import React, { useState, useRef, useEffect } from 'react';
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

const OverflowMenu = styled.div`
  position: absolute;
  bottom: 28px;
  right: 12px;
  background: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
`;

const OverflowContainer = styled.div`
  position: relative;
`;

export default function StatusBar() {
  const { 
    theme, 
    setTheme, 
    selectedModel, 
    isLocalMode, 
    activeFile,
    agents
  } = useAppStore();
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowOverflow(false);
    };
    const onClick = (ev: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(ev.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

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
        <StatusItem title="Provider">
          {isLocalMode ? '🏠 Local' : '☁️ Remote'}
        </StatusItem>

        <StatusItem title="Active Model">
          🧠 {selectedModel || 'Auto'}
        </StatusItem>

        <ThemeButton onClick={toggleTheme}>
          🎨 {getThemeDisplayName(theme)}
        </ThemeButton>

        {/* Overflow menu for secondary items */}
        <OverflowContainer ref={overflowRef}>
          <StatusItem onClick={() => setShowOverflow((s) => !s)} aria-haspopup="true" aria-expanded={showOverflow} tabIndex={0} role="button">
            ⋯
          </StatusItem>
          {showOverflow && (
            <OverflowMenu role="menu" aria-label="More status items">
              <div>Chat: { /* placeholder */ }</div>
              <div>Open-Deep-Coder v0.1.0</div>
            </OverflowMenu>
          )}
        </OverflowContainer>
      </StatusRight>
    </StatusBarContainer>
  );
}