import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAppStore } from '@store';

const TerminalContainer = styled.div`
  height: 100%;
  background-color: ${props => props.theme.colors.bg.primary};
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
  height: 32px;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
`;

const TerminalTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const TerminalControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ControlButton = styled.button`
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

const TerminalContent = styled.div`
  flex: 1;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.primary};
`;

const TerminalLine = styled.div<{ type?: 'command' | 'output' | 'error' }>`
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => {
    switch (props.type) {
      case 'command': return props.theme.colors.syntax.keyword;
      case 'error': return props.theme.colors.text.error;
      case 'output': return props.theme.colors.text.primary;
      default: return props.theme.colors.text.primary;
    }
  }};
`;

const PromptLine = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

const Prompt = styled.span`
  color: ${props => props.theme.colors.syntax.keyword};
  margin-right: 8px;
`;

const CommandInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  font-family: inherit;
  font-size: inherit;
  outline: none;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export default function TerminalPanel() {
  const { toggleTerminal } = useAppStore();
  const [output, setOutput] = useState<TerminalOutput[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to Open-Deep-Coder Terminal\nType "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to output
    addOutput('command', `$ ${command}`);
    
    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Mock command execution
    try {
      let response = '';
      
      switch (command.toLowerCase().trim()) {
        case 'help':
          response = `Available commands:
  help          - Show this help message
  clear         - Clear terminal output
  agents        - Show agent status
  models        - Show available LLM models
  test          - Run tests
  build         - Build project
  dev           - Start development server`;
          break;
          
        case 'clear':
          setOutput([]);
          return;
          
        case 'agents':
          response = `Agent Status:
  🎯 Orchestrator: idle
  📋 Planner: idle
  ⚡ Implementer: idle
  ✅ Verifier: idle
  🔍 Reviewer: idle
  🔬 Researcher: idle`;
          break;
          
        case 'models':
          response = `Available Models:
  🧠 GPT-4 (remote)
  🧠 Claude-3 Sonnet (remote)
  🏠 Llama 2 7B (local)
  🏠 Code Llama 13B (local)`;
          break;
          
        case 'test':
          response = `Running tests...
✅ 23 tests passed
⚠️  2 tests skipped
🎉 All tests completed successfully!`;
          break;
          
        case 'build':
          response = `Building project...
📦 Bundling frontend...
🐍 Checking Python backend...
✅ Build completed successfully!`;
          break;
          
        case 'dev':
          response = `Starting development server...
🌐 Frontend: http://localhost:1420
🐍 Backend: http://localhost:8000
🚀 Open-Deep-Coder is running!`;
          break;
          
        default:
          if (command.startsWith('echo ')) {
            response = command.substring(5);
          } else {
            response = `Command not found: ${command}
Type "help" for available commands.`;
          }
      }
      
      // Simulate async execution
      await new Promise(resolve => setTimeout(resolve, 300));
      addOutput('output', response);
      
    } catch (error) {
      addOutput('error', `Error executing command: ${error}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalTitle>Terminal</TerminalTitle>
        <TerminalControls>
          <ControlButton onClick={() => setOutput([])}>
            Clear
          </ControlButton>
          <ControlButton onClick={toggleTerminal}>
            ✕
          </ControlButton>
        </TerminalControls>
      </TerminalHeader>
      
      <TerminalContent ref={contentRef}>
        {output.map((line) => (
          <TerminalLine key={line.id} type={line.type}>
            {line.content}
          </TerminalLine>
        ))}
        
        <PromptLine>
          <Prompt>$</Prompt>
          <CommandInput
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            autoFocus
          />
        </PromptLine>
      </TerminalContent>
    </TerminalContainer>
  );
}