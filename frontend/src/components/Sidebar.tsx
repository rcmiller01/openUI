import { useState } from 'react';
import styled from 'styled-components';
import { useAppStore } from '../store';
import FileExplorer from './FileExplorer';

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

// New styled component for Advanced Tools link
const AdvancedToolsLink = styled.div`
  padding: 8px 16px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

export default function Sidebar() {
  const { toggleSidebar, setIsAdvancedToolsOpen } = useAppStore();
  const [activeSection, setActiveSection] = useState<string>('explorer');

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
            <FileExplorer />
          )}
        </Section>

        <Section>
          <SectionHeader 
            onClick={() => setActiveSection(activeSection === 'search' ? '' : 'search')}
          >
            🔍 Search
          </SectionHeader>
          {activeSection === 'search' && (
            <div style={{ padding: '16px' }}>
              <input 
                type="text" 
                placeholder="Search files..." 
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Search results will appear here...
              </div>
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
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <button style={{
                  padding: '4px 8px',
                  marginRight: '4px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  Commit
                </button>
                <button style={{
                  padding: '4px 8px',
                  marginRight: '4px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  Push
                </button>
                <button style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  Pull
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Git status and changes will appear here...
              </div>
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
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <button style={{
                  padding: '4px 8px',
                  marginRight: '4px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  LSP
                </button>
                <button style={{
                  padding: '4px 8px',
                  marginRight: '4px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  MCP
                </button>
                <button style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  background: '#f8f8f8'
                }}>
                  n8n
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Extension status and management...
              </div>
            </div>
          )}
        </Section>

        {/* Advanced Tools Link */}
        <Section>
          <AdvancedToolsLink onClick={() => setIsAdvancedToolsOpen(true)}>
            🛠️ Advanced Tools
          </AdvancedToolsLink>
        </Section>
      </SidebarContent>
    </SidebarContainer>
  );
}