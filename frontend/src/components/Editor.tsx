import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';
import { useAppStore } from '../store';
import apiClient from '../services/api';

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
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Configure Monaco Editor theme based on current theme
  useEffect(() => {
    const currentTheme = theme.includes('dark') ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(currentTheme);
  }, [theme]);

  // Load file content when a file is opened
  useEffect(() => {
    if (!activeFile || fileContents.has(activeFile)) return;

    const loadFileContent = async () => {
      setIsLoading(true);
      try {
        const content = await apiClient.getFileContent(activeFile);
        if (content) {
          setFileContents(prev => new Map(prev.set(activeFile, content.content)));
        } else {
          // File doesn't exist or is empty
          setFileContents(prev => new Map(prev.set(activeFile, '')));
        }
      } catch (error) {
        console.error('Error loading file content:', error);
        setFileContents(prev => new Map(prev.set(activeFile, `// Error loading file: ${error}`)));
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [activeFile, fileContents]);

  // Auto-save functionality
  const saveFile = async (filePath: string, content: string) => {
    try {
      await apiClient.saveFileContent(filePath, content);
      console.log('File saved:', filePath);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const scheduleAutoSave = (filePath: string, content: string) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (settings.autoSave) {
      const timeout = setTimeout(() => {
        saveFile(filePath, content);
      }, settings.autoSaveDelay || 1000);
      setAutoSaveTimeout(timeout);
    }
  };

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current || !activeFile) return;

    // Dispose existing editor
    if (editorRef.current) {
      editorRef.current.dispose();
    }

    const content = fileContents.get(activeFile) || (isLoading ? '// Loading...' : '');

    // Create new editor instance
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: content,
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
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
    });

    // Handle content changes
    editorRef.current.onDidChangeModelContent(() => {
      const currentContent = editorRef.current?.getValue() || '';
      
      // Update local content cache
      setFileContents(prev => new Map(prev.set(activeFile, currentContent)));
      
      // Schedule auto-save
      scheduleAutoSave(activeFile, currentContent);
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [activeFile, theme, settings, fileContents, isLoading]);

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