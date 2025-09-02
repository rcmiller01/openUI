import { useEffect, useRef } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { useAppStore, AgentType } from './store';
import { themes } from './themes';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ChatPanel from './components/ChatPanel';
import StatusBar from './components/StatusBar';
import AgentPanel from './components/AgentPanel';
import TerminalPanel from './components/TerminalPanel';
import { AdvancedToolsDashboard } from './components/advanced/AdvancedToolsDashboard';

const GlobalStyle = createGlobalStyle`
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

  /* Accessible focus outlines for keyboard users */
  :focus-visible {
    outline: 2px solid ${props => props.theme.colors.border.accent};
    outline-offset: 2px;
  }

  /* Forced-colors / High contrast support fallback */
  @media (forced-colors: active) {
    :focus-visible {
      outline: 3px solid WindowText;
    }
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
  display: grid;
  grid-template-columns: 280px 1fr 360px;
  grid-template-rows: 1fr;
  height: 100vh;
  width: 100vw;
  gap: 0;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
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

// Advanced Tools Modal
const AdvancedToolsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const AdvancedToolsContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  max-height: 800px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow: auto;
`;

export default function App() {
  const { 
    theme, 
    isSidebarOpen, 
    isChatPanelOpen, 
    isTerminalOpen,
    isAdvancedToolsOpen,
    setIsAdvancedToolsOpen,
    conversations,
    createConversation,
    agents,
    runAgent
  } = useAppStore();

  const currentTheme = themes[theme as keyof typeof themes];

  const modalCloseRef = useRef<HTMLButtonElement | null>(null);

  // Initialize default conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation('Welcome to Open-Deep-Coder');
    }
  }, [conversations.length, createConversation]);

  // Start background agents
  useEffect(() => {
    const startBackgroundAgents = () => {
      // Start orchestrator, planner, and implementer in background
      const backgroundAgents: AgentType[] = ['orchestrator', 'planner', 'implementer'];
      backgroundAgents.forEach(agentType => {
        if (agents[agentType].status === 'idle') {
          runAgent(agentType, `Background ${agentType} service`);
        }
      });
    };

    // Start background agents after a short delay
    const timer = setTimeout(startBackgroundAgents, 2000);
    return () => clearTimeout(timer);
  }, [agents, runAgent]);

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

        {/* Right panel: Agents (resizable/collapsible) */}
        <AgentPanel />
      </AppContainer>

      {/* Advanced Tools Modal */}
      {isAdvancedToolsOpen && (
        <AdvancedToolsModal role="dialog" aria-modal="true" aria-label="Advanced tools dashboard">
          <AdvancedToolsContent>
            <ModalHeader>
              <ModalTitle>Advanced Tools Dashboard</ModalTitle>
              <CloseButton ref={modalCloseRef} onClick={() => setIsAdvancedToolsOpen(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <AdvancedToolsDashboard />
            </ModalBody>
          </AdvancedToolsContent>
        </AdvancedToolsModal>
      )}
    </ThemeProvider>
  );
}