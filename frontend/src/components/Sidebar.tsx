import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppStore } from '@store';

const SidebarContainer = styled.div`
  width: ${props => props.theme.sidebarWidth || 300}px;
  height: 100%;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-right: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 8px;
`;

const SectionHeader = styled.div`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${props => props.theme.colors.bg.tertiary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
`;

const FileList = styled.div`
  padding: 8px 0;
`;

const FileItem = styled.div<{ isActive?: boolean }>`
  padding: 6px 16px 6px 24px;
  font-size: 13px;
  color: ${props => props.isActive ? props.theme.colors.text.accent : props.theme.colors.text.primary};
  cursor: pointer;
  background-color: ${props => props.isActive ? props.theme.colors.ui.selection : 'transparent'};
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
`;

const FolderItem = styled.div<{ isExpanded?: boolean }>`
  padding: 6px 16px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
  
  &::before {
    content: '${props => props.isExpanded ? '📂' : '📁'}';
    font-size: 14px;
  }
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

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

// Mock file tree data
const mockFileTree: FileTreeNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        path: 'src/components',
        type: 'folder',
        children: [
          { name: 'App.tsx', path: 'src/components/App.tsx', type: 'file' },
          { name: 'ChatPanel.tsx', path: 'src/components/ChatPanel.tsx', type: 'file' },
          { name: 'Editor.tsx', path: 'src/components/Editor.tsx', type: 'file' },
        ]
      },
      {
        name: 'store',
        path: 'src/store',
        type: 'folder',
        children: [
          { name: 'index.ts', path: 'src/store/index.ts', type: 'file' },
        ]
      },
      { name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
    ]
  },
  {
    name: 'backend',
    path: 'backend',
    type: 'folder',
    children: [
      { name: 'main.py', path: 'backend/main.py', type: 'file' },
      { name: 'agents.py', path: 'backend/agents.py', type: 'file' },
    ]
  },
  { name: 'README.md', path: 'README.md', type: 'file' },
  { name: 'package.json', path: 'package.json', type: 'file' },
];

export default function Sidebar() {
  const { openFile, activeFile, toggleSidebar } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [activeSection, setActiveSection] = useState<string>('explorer');

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (filePath: string) => {
    openFile(filePath);
  };

  const renderFileTree = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isActive = node.path === activeFile;
      
      if (node.type === 'folder') {
        return (
          <div key={node.path}>
            <FolderItem
              isExpanded={isExpanded}
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${16 + depth * 12}px` }}
            >
              {node.name}
            </FolderItem>
            {isExpanded && node.children && (
              <div>
                {renderFileTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <FileItem
            key={node.path}
            isActive={isActive}
            onClick={() => handleFileClick(node.path)}
            style={{ paddingLeft: `${24 + depth * 12}px` }}
          >
            📄 {node.name}
          </FileItem>
        );
      }
    });
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarTitle>Explorer</SidebarTitle>
        <ToggleButton onClick={toggleSidebar}>
          ←
        </ToggleButton>
      </SidebarHeader>

      <SidebarContent>
        <Section>
          <SectionHeader 
            onClick={() => setActiveSection(activeSection === 'explorer' ? '' : 'explorer')}
          >
            📁 File Explorer
          </SectionHeader>
          {activeSection === 'explorer' && (
            <FileList>
              {renderFileTree(mockFileTree)}
            </FileList>
          )}
        </Section>

        <Section>
          <SectionHeader 
            onClick={() => setActiveSection(activeSection === 'search' ? '' : 'search')}
          >
            🔍 Search
          </SectionHeader>
          {activeSection === 'search' && (
            <div style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
              Search functionality coming soon...
            </div>
          )}
        </Section>

        <Section>
          <SectionHeader 
            onClick={() => setActiveSection(activeSection === 'git' ? '' : 'git')}
          >
            🌿 Source Control
          </SectionHeader>
          {activeSection === 'git' && (
            <div style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
              Git integration coming soon...
            </div>
          )}
        </Section>

        <Section>
          <SectionHeader 
            onClick={() => setActiveSection(activeSection === 'extensions' ? '' : 'extensions')}
          >
            🧩 Extensions
          </SectionHeader>
          {activeSection === 'extensions' && (
            <div style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
              LSP, MCP, and n8n integrations coming soon...
            </div>
          )}
        </Section>
      </SidebarContent>
    </SidebarContainer>
  );
}