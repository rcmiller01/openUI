import React, { useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { useAppStore } from '@store';
import { themes } from '@themes';
import Sidebar from '@components/Sidebar';
import Editor from '@components/Editor';
import ChatPanel from '@components/ChatPanel';
import StatusBar from '@components/StatusBar';
import AgentPanel from '@components/AgentPanel';
import TerminalPanel from '@components/TerminalPanel';

const GlobalStyle = createGlobalStyle<{ theme: any }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: ${props => props.theme.colors.bg.primary};
    color: ${props => props.theme.colors.text.primary};
    overflow: hidden;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bg.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.primary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.border.accent};
  }

  .monaco-editor {
    background-color: ${props => props.theme.colors.bg.primary} !important;
  }

  .monaco-editor .margin {
    background-color: ${props => props.theme.colors.bg.secondary} !important;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const EditorArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const CentralPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const BottomPanel = styled.div<{ isOpen: boolean }>`
  height: ${props => props.isOpen ? '300px' : '0'};
  overflow: hidden;
  transition: height 0.3s ease;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

export default function App() {
  const { 
    theme, 
    isSidebarOpen, 
    isChatPanelOpen, 
    isTerminalOpen,
    conversations,
    createConversation
  } = useAppStore();

  const currentTheme = themes[theme];

  // Initialize default conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation('Welcome to Open-Deep-Coder');
    }
  }, [conversations.length, createConversation]);

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppContainer>
        {isSidebarOpen && <Sidebar />}
        
        <MainContent>
          <EditorArea>
            <CentralPanel>
              <Editor />
              <BottomPanel isOpen={isTerminalOpen}>
                <TerminalPanel />
              </BottomPanel>
            </CentralPanel>
            
            {isChatPanelOpen && <ChatPanel />}
          </EditorArea>
          
          <StatusBar />
        </MainContent>

        <AgentPanel />
      </AppContainer>
    </ThemeProvider>
  );
}