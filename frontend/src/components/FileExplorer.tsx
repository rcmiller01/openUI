import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppStore } from '@/store';
import apiClient, { FileInfo } from '../services/api';

const ExplorerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-right: 1px solid ${props => props.theme.colors.border.primary};
`;

const ExplorerHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  justify-content: between;
  align-items: center;
`;

const ExplorerTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`;

const FileList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const FileItem = styled.div<{ isDirectory: boolean; isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.isActive ? props.theme.colors.ui.hover : 'transparent'};
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
  
  ${props => props.isDirectory && `
    font-weight: 500;
  `}
`;

const FileIcon = styled.span<{ isDirectory: boolean }>`
  margin-right: 8px;
  font-size: 12px;
  color: ${props => props.isDirectory 
    ? props.theme.colors.text.accent 
    : props.theme.colors.text.secondary
  };
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Breadcrumb = styled.div`
  padding: 8px 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BreadcrumbItem = styled.span<{ clickable?: boolean }>`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  
  &:hover {
    color: ${props => props.clickable ? props.theme.colors.text.primary : 'inherit'};
  }
`;

const LoadingState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
`;

const ErrorState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${props => props.theme.colors.text.error};
  font-size: 12px;
`;

export default function FileExplorer() {
  const { openFile, openFiles } = useAppStore();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fileList = await apiClient.listFiles(path);
      setFiles(fileList.sort((a, b) => {
        // Directories first, then files
        if (a.is_directory !== b.is_directory) {
          return a.is_directory ? -1 : 1;
        }
        // Alphabetical within each group
        return a.name.localeCompare(b.name);
      }));
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, []);

  const handleFileClick = async (file: FileInfo) => {
    if (file.is_directory) {
      await loadFiles(file.path);
    } else {
      // Open file in editor
      openFile(file.path);
    }
  };

  const navigateToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '.';
    loadFiles(parentPath);
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.is_directory) {
      return '📁';
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '📄';
      case 'py':
        return '🐍';
      case 'json':
        return '⚙️';
      case 'md':
        return '📝';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      default:
        return '📄';
    }
  };

  const pathParts = currentPath.split(/[\\\\/]/).filter(Boolean);

  return (
    <ExplorerContainer>
      <ExplorerHeader>
        <ExplorerTitle>Explorer</ExplorerTitle>
      </ExplorerHeader>
      
      <Breadcrumb>
        <BreadcrumbItem clickable onClick={() => loadFiles('.')}>
          Root
        </BreadcrumbItem>
        {pathParts.map((part, index) => {
          const pathUpToHere = pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={index}>
              <span>/</span>
              <BreadcrumbItem 
                clickable 
                onClick={() => loadFiles(pathUpToHere)}
              >
                {part}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </Breadcrumb>

      <FileList>
        {loading && <LoadingState>Loading files...</LoadingState>}
        {error && <ErrorState>{error}</ErrorState>}
        
        {!loading && !error && (
          <>
            {currentPath !== '.' && (
              <FileItem isDirectory onClick={navigateToParent}>
                <FileIcon isDirectory>📁</FileIcon>
                <FileName>..</FileName>
              </FileItem>
            )}
            
            {files.map((file) => (
              <FileItem
                key={file.path}
                isDirectory={file.is_directory}
                isActive={!file.is_directory && openFiles.includes(file.path)}
                onClick={() => handleFileClick(file)}
              >
                <FileIcon isDirectory={file.is_directory}>
                  {getFileIcon(file)}
                </FileIcon>
                <FileName>{file.name}</FileName>
              </FileItem>
            ))}
          </>
        )}
      </FileList>
    </ExplorerContainer>
  );
}