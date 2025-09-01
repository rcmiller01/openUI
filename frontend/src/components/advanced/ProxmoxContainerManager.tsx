import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../../services/api';
import Modal from '../ui/Modal';

const Container = styled.div`
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin: 10px;
`;

const Header = styled.h2`
  color: var(--text-primary);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NodeSelector = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: 20px;
`;

const ContainerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
`;

const ContainerCard = styled.div`
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ContainerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ContainerName = styled.h3`
  color: var(--text-primary);
  margin: 0;
  font-size: 16px;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;

  ${props => {
    switch (props.status) {
      case 'running':
        return 'background: #10b981; color: white;';
      case 'stopped':
        return 'background: #ef4444; color: white;';
      case 'paused':
        return 'background: #f59e0b; color: white;';
      default:
        return 'background: #6b7280; color: white;';
    }
  }}
`;

const ContainerInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return 'background: var(--accent-color); color: white;';
      case 'danger':
        return 'background: #ef4444; color: white;';
      default:
        return 'background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);';
    }
  }}

  &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FileBrowser = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
`;

const FileList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--bg-secondary);
  }
`;

const FileIcon = styled.span`
  margin-right: 8px;
  font-size: 14px;
`;

const FileName = styled.span`
  flex: 1;
  font-size: 14px;
`;

const FileSize = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 10px;
`;

const InputsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
`;

const CenteredLoading = styled.div`
  text-align: center;
  padding: 20px;
`;

const MetaSpan = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const SpinnerWrap = styled.div`
  margin-top: 8px;
`;

const SaveButton = styled.button`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  border-top-color: var(--accent-color);
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface ProxmoxContainer {
  vmid: number;
  name: string;
  node: string;
  status: string;
  cpus: number;
  memory: number;
  disk: number;
  ip_address?: string;
  template: boolean;
}

interface ContainerFile {
  path: string;
  name: string;
  size: number;
  modified: string;
  is_directory: boolean;
  permissions: string;
}

export const ProxmoxContainerManager: React.FC = () => {
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [proxmoxHost, setProxmoxHost] = useState<string>(localStorage.getItem('PROXMOX_HOST') || 'localhost');
  const [proxmoxPort, setProxmoxPort] = useState<string>(localStorage.getItem('PROXMOX_PORT') || '8006');
  const [proxmoxUser, setProxmoxUser] = useState<string>(localStorage.getItem('PROXMOX_USER') || 'root@pam');
  const [proxmoxPass, setProxmoxPass] = useState<string>(localStorage.getItem('PROXMOX_PASS') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [copyNote, setCopyNote] = useState<'idle' | 'copied' | null>('idle');
  const [containers, setContainers] = useState<ProxmoxContainer[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<ProxmoxContainer | null>(null);
  const [containerFiles, setContainerFiles] = useState<ContainerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadNodes();
  }, []);

  const saveProxmoxCredentials = async () => {
    setModalOpen(true);
    setSaveStatus('saving');
    try {
      await apiClient.storeCredential('proxmox', {
        host: proxmoxHost,
        port: proxmoxPort,
        username: proxmoxUser,
        password: proxmoxPass,
      });
      localStorage.setItem('PROXMOX_HOST', proxmoxHost);
      localStorage.setItem('PROXMOX_PORT', proxmoxPort);
      localStorage.setItem('PROXMOX_USER', proxmoxUser);
      setSaveStatus('success');
      setCopyNote('idle');
      // Optionally reload nodes
      loadNodes();
    } catch (err) {
      console.error('Error saving proxmox credentials', err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (selectedNode) {
      loadContainers();
    }
  }, [selectedNode]);

  const loadNodes = async () => {
    try {
      const nodes = await apiClient.getProxmoxNodes();
      setNodes(nodes);
      if (nodes && nodes.length > 0) {
        setSelectedNode(nodes[0]);
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
    }
  };

  const loadContainers = async () => {
    if (!selectedNode) return;

    setLoading(true);
    try {
      const containers = await apiClient.getContainers(selectedNode);
      setContainers(containers);
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerAction = async (container: ProxmoxContainer, action: string) => {
    const actionKey = `${container.vmid}-${action}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      switch (action) {
        case 'start':
          await apiClient.startContainer(selectedNode, container.vmid);
          break;
        case 'stop':
          await apiClient.stopContainer(selectedNode, container.vmid);
          break;
        case 'restart':
          await apiClient.restartContainer(selectedNode, container.vmid);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      // Refresh container status
      await loadContainers();
    } catch (error) {
      console.error(`Error ${action}ing container:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const loadContainerFiles = async (container: ProxmoxContainer, path: string = '/') => {
    try {
      const files = await apiClient.listContainerFiles(selectedNode, container.vmid, path);
      setContainerFiles(files);
      setSelectedContainer(container);
    } catch (error) {
      console.error('Error loading container files:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
    <Container>
      <Header>
        🐳 Proxmox Container Manager
      </Header>

      <InputsRow>
        <input value={proxmoxHost} onChange={(e) => setProxmoxHost(e.target.value)} placeholder="host" />
        <input value={proxmoxPort} onChange={(e) => setProxmoxPort(e.target.value)} placeholder="port" />
        <input value={proxmoxUser} onChange={(e) => setProxmoxUser(e.target.value)} placeholder="username" />
        <input value={proxmoxPass} onChange={(e) => setProxmoxPass(e.target.value)} placeholder="password" type="password" />
        <SaveButton onClick={saveProxmoxCredentials}>Save</SaveButton>
      </InputsRow>

  <NodeSelector aria-label="Proxmox node" value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}>
        <option value="">Select Node</option>
        {nodes.map(node => (
          <option key={node} value={node}>{node}</option>
        ))}
      </NodeSelector>

      {loading ? (
        <CenteredLoading>
          <LoadingSpinner />
          <p>Loading containers...</p>
        </CenteredLoading>
      ) : (
        <ContainerGrid>
          {containers.map(container => (
            <ContainerCard key={container.vmid}>
              <ContainerHeader>
                <ContainerName>{container.name}</ContainerName>
                <StatusBadge status={container.status}>
                  {container.status}
                </StatusBadge>
              </ContainerHeader>

              <ContainerInfo>
                <InfoItem>
                  <span>ID:</span>
                  <span>{container.vmid}</span>
                </InfoItem>
                <InfoItem>
                  <span>CPUs:</span>
                  <span>{container.cpus}</span>
                </InfoItem>
                <InfoItem>
                  <span>Memory:</span>
                  <span>{container.memory} MB</span>
                </InfoItem>
                <InfoItem>
                  <span>Disk:</span>
                  <span>{container.disk} GB</span>
                </InfoItem>
                {container.ip_address && (
                  <InfoItem>
                    <span>IP:</span>
                    <span>{container.ip_address}</span>
                  </InfoItem>
                )}
              </ContainerInfo>

              <ActionButtons>
                <ActionButton
                  variant="secondary"
                  onClick={() => loadContainerFiles(container)}
                  disabled={container.status !== 'running'}
                >
                  📁 Browse Files
                </ActionButton>

                {container.status === 'running' ? (
                  <>
                    <ActionButton
                      variant="secondary"
                      onClick={() => handleContainerAction(container, 'restart')}
                      disabled={actionLoading[`${container.vmid}-restart`]}
                    >
                      {actionLoading[`${container.vmid}-restart`] ? <LoadingSpinner /> : '🔄'} Restart
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => handleContainerAction(container, 'stop')}
                      disabled={actionLoading[`${container.vmid}-stop`]}
                    >
                      {actionLoading[`${container.vmid}-stop`] ? <LoadingSpinner /> : '⏹️'} Stop
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    variant="primary"
                    onClick={() => handleContainerAction(container, 'start')}
                    disabled={actionLoading[`${container.vmid}-start`]}
                  >
                    {actionLoading[`${container.vmid}-start`] ? <LoadingSpinner /> : '▶️'} Start
                  </ActionButton>
                )}
              </ActionButtons>
            </ContainerCard>
          ))}
        </ContainerGrid>
      )}

      {selectedContainer && (
        <FileBrowser>
          <h3>Files in {selectedContainer.name}</h3>
          <FileList>
            {containerFiles.map((file, index) => (
              <FileItem key={index}>
                <FileIcon>
                  {file.is_directory ? '📁' : '📄'}
                </FileIcon>
                <FileName>{file.name}</FileName>
                <FileSize>
                  {file.is_directory ? '' : formatBytes(file.size)}
                </FileSize>
                <MetaSpan>{formatDate(file.modified)}</MetaSpan>
              </FileItem>
            ))}
          </FileList>
        </FileBrowser>
      )}
  </Container>
  <Modal open={modalOpen} title="Save Proxmox Credentials" onClose={() => { setModalOpen(false); setSaveStatus('idle'); setCopyNote('idle'); }}>
      <div>
        {saveStatus === 'saving' && (
          <div>
            <div>Saving credentials to server...</div>
            <SpinnerWrap><LoadingSpinner /></SpinnerWrap>
          </div>
        )}

        {saveStatus === 'success' && (
          <div>
            <div className="font-semibold text-green-600">Credentials saved</div>
            <div className="mt-2">Host: <span className="font-mono">{proxmoxHost}:{proxmoxPort}</span></div>
            <div className="mt-2">User: <span className="font-mono">{proxmoxUser}</span></div>
            <div className="mt-3 flex items-center space-x-2">
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={async () => { try { await navigator.clipboard.writeText(`${proxmoxHost}:${proxmoxPort}`); setCopyNote('copied'); setTimeout(() => setCopyNote('idle'), 1500); } catch {} }}>Copy Host</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { setModalOpen(false); setSaveStatus('idle'); }}>Close</button>
              {copyNote === 'copied' && <div className="text-sm text-green-600 ml-2">Copied</div>}
            </div>
          </div>
        )}

        {saveStatus === 'error' && (
          <div>
            <div className="text-red-600 font-semibold">Failed to save credentials</div>
            <div className="mt-2">Check server logs and try again.</div>
            <div className="mt-3">
              <button className="px-3 py-1 bg-red-100 rounded" onClick={() => { setModalOpen(false); setSaveStatus('idle'); }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
    </>
  );
};
