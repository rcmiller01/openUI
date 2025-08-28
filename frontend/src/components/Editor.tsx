import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';
import { useAppStore } from '@store';

const EditorContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const TabBar = styled.div`
  height: 36px;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  overflow-x: auto;
`;

const Tab = styled.div<{ isActive: boolean }>`
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background-color: ${props => props.isActive ? props.theme.colors.bg.primary : 'transparent'};
  border-right: 1px solid ${props => props.theme.colors.border.primary};
  cursor: pointer;
  font-size: 13px;
  color: ${props => props.isActive ? props.theme.colors.text.primary : props.theme.colors.text.secondary};
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const CloseTabButton = styled.span`
  margin-left: 8px;
  opacity: 0.6;
  
  &:hover {
    opacity: 1;
  }
`;

const EditorWrapper = styled.div`
  height: calc(100% - 36px);
  width: 100%;
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.muted};
  font-size: 14px;
`;

export default function Editor() {
  const {
    openFiles,
    activeFile,
    setActiveFile,
    closeFile,
    theme,
    settings
  } = useAppStore();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configure Monaco Editor theme based on current theme
  useEffect(() => {
    const currentTheme = theme.includes('dark') ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(currentTheme);
  }, [theme]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current || !activeFile) return;

    // Dispose existing editor
    if (editorRef.current) {
      editorRef.current.dispose();
    }

    // Create new editor instance
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: `// Welcome to Open-Deep-Coder!\n// This is a placeholder for file: ${activeFile}\n\nfunction hello() {\n  console.log("Hello from the agentic IDE!");\n}\n\n// Features coming soon:\n// - Real file loading\n// - LSP integration\n// - AI-powered code completion\n// - Multi-agent assistance`,
      language: getLanguageFromFilePath(activeFile),
      theme: theme.includes('dark') ? 'vs-dark' : 'vs',
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
    });

    // Handle content changes
    editorRef.current.onDidChangeModelContent(() => {
      // TODO: Implement auto-save functionality
      // TODO: Trigger agent analysis on content changes
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [activeFile, theme, settings]);

  const getLanguageFromFilePath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'dart': 'dart',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'shell',
      'sql': 'sql',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const handleTabClick = (filePath: string) => {
    setActiveFile(filePath);
  };

  const handleCloseTab = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    closeFile(filePath);
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  if (openFiles.length === 0) {
    return (
      <EditorContainer>
        <EmptyState>
          <h3>Welcome to Open-Deep-Coder</h3>
          <p>Open a file to start coding with AI assistance</p>
          <br />
          <p>🤖 Multi-agent workflow ready</p>
          <p>🎨 Four theme variants available</p>
          <p>🔌 LLM integration active</p>
        </EmptyState>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer>
      <TabBar>
        {openFiles.map((filePath) => (
          <Tab
            key={filePath}
            isActive={filePath === activeFile}
            onClick={() => handleTabClick(filePath)}
          >
            {getFileName(filePath)}
            <CloseTabButton onClick={(e) => handleCloseTab(e, filePath)}>
              ✕
            </CloseTabButton>
          </Tab>
        ))}
      </TabBar>
      
      <EditorWrapper ref={containerRef} />
    </EditorContainer>
  );
}