import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';
import Modal from '../ui/Modal';

export const GitIntegration: React.FC = () => {
  const [gitStatus, setGitStatus] = useState<any>({});
  const [repositoryPath, setRepositoryPath] = useState('.');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const remoteConfig = { remote: 'origin', branch: 'main' };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setAuthStatus] = useState<any>({});
  const [githubDevice, setGithubDevice] = useState<any>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const pollingRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'code' | 'url' | null>('idle');
  const githubClientId = localStorage.getItem('GITHUB_CLIENT_ID') || '';
  const [repoForm, setRepoForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    localPath: '',
    cloneUrl: ''
  });

  useEffect(() => {
    loadGitStatus();
  }, [repositoryPath]);

  const loadGitStatus = async () => {
    if (!repositoryPath) return;
    
    setLoading(true);
    setError(null);
    try {
      const status = await apiClient.getGitStatus(repositoryPath);
      if (status.success) {
        setGitStatus(status.status || {});
      } else {
        setError(status.message);
      }
    } catch (err) {
      setError(`Failed to load git status: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    // Offer device flow if client id is present, otherwise fallback to token prompt
    if (githubClientId) {
      try {
        const resp = await apiClient.githubDeviceStart(githubClientId);
        setGithubDevice(resp);
        localStorage.setItem('GITHUB_CLIENT_ID', githubClientId);
        // open modal and subscribe to server-sent events for the device_code
        setDeviceModalOpen(true);
        setPollStatus('waiting');
        try {
          const url = `/api/credentials/github/device/subscribe?device_code=${encodeURIComponent(resp.device_code)}`;
          const es = new EventSource(url);
          eventSourceRef.current = es;
          es.onmessage = (ev) => {
            try {
              const data = JSON.parse(ev.data);
              if (data.status === 'ok') {
                setAuthStatus({ github: 'authenticated' });
                setPollStatus('authenticated');
                es.close();
                eventSourceRef.current = null;
              } else if (data.status === 'pending') {
                setPollStatus('pending');
              } else if (data.status === 'error') {
                setPollStatus('error');
                setError(data.error || 'unknown');
                es.close();
                eventSourceRef.current = null;
              }
            } catch (e) {
              console.error('Invalid SSE message', e);
            }
          };
          es.onerror = (ev) => {
            console.error('SSE error', ev);
            setPollStatus('error');
            setError('SSE connection error');
            try { es.close(); } catch {};
            eventSourceRef.current = null;
          };
        } catch (e) {
          setError(`Failed to open EventSource: ${e}`);
        }
      } catch (err) {
        setError(`Device auth error: ${err}`);
      }
      return;
    }

    const username = prompt('Enter your Git username:');
    const token = prompt('Enter your Git token:');
    const email = prompt('Enter your email:');

    if (!username || !token || !email) return;

    setLoading(true);
    try {
      const result = await apiClient.authenticateGit(username, token, email);
      setAuthStatus(result);
      if (result.success) {
        alert('Git authentication successful!');
      } else {
        alert(`Authentication failed: ${result.message}`);
      }
    } catch (err) {
      setError(`Authentication error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (what: 'code' | 'url') => {
    try {
      if (what === 'code' && githubDevice?.user_code) {
        await navigator.clipboard.writeText(githubDevice.user_code);
        setCopyStatus('code');
      } else if (what === 'url' && githubDevice?.verification_uri) {
        await navigator.clipboard.writeText(githubDevice.verification_uri);
        setCopyStatus('url');
      }
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (_) {
      // ignore clipboard failures
      setCopyStatus('idle');
    }
  };

  const handleCreateRepository = async () => {
    if (!repoForm.name) {
      alert('Please enter a repository name');
      return;
    }
    
    setLoading(true);
    try {
      const result = await apiClient.createGitRepository(
        repoForm.name, 
        repoForm.description, 
        repoForm.isPrivate
      );
      if (result.success) {
        alert(`Repository created: ${result.repository.url}`);
        setRepoForm({...repoForm, name: '', description: ''});
      } else {
        alert(`Failed to create repository: ${result.message}`);
      }
    } catch (err) {
      setError(`Error creating repository: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneRepository = async () => {
    if (!repoForm.cloneUrl || !repoForm.localPath) {
      alert('Please enter both repository URL and local path');
      return;
    }
    
    setLoading(true);
    try {
      const result = await apiClient.cloneGitRepository(repoForm.cloneUrl, repoForm.localPath);
      if (result.success) {
        alert(`Repository cloned to: ${result.path}`);
        setRepositoryPath(repoForm.localPath);
        setRepoForm({...repoForm, cloneUrl: '', localPath: ''});
        loadGitStatus();
      } else {
        alert(`Failed to clone repository: ${result.message}`);
      }
    } catch (err) {
      setError(`Error cloning repository: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitRepository = async () => {
    if (!repoForm.localPath || !repoForm.name) {
      alert('Please enter both local path and repository name');
      return;
    }
    
    setLoading(true);
    try {
      const result = await apiClient.initGitRepository(repoForm.localPath, repoForm.name);
      if (result.success) {
        alert(`Repository initialized${result.repository ? ' and pushed to remote' : ''}`);
        setRepositoryPath(repoForm.localPath);
        setRepoForm({...repoForm, localPath: '', name: ''});
        loadGitStatus();
      } else {
        alert(`Failed to initialize repository: ${result.message}`);
      }
    } catch (err) {
      setError(`Error initializing repository: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage) {
      alert('Please enter a commit message');
      return;
    }
    
    setLoading(true);
    try {
  const result = await apiClient.gitCommit(
        repositoryPath, 
        commitMessage, 
        selectedFiles.length > 0 ? selectedFiles : undefined
      );
      if (result.success) {
        alert('Changes committed successfully!');
        setCommitMessage('');
        setSelectedFiles([]);
        loadGitStatus();
      } else {
        alert(`Failed to commit: ${result.message}`);
      }
    } catch (err) {
      setError(`Error committing changes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
  const result = await apiClient.gitPush(repositoryPath, remoteConfig.remote, remoteConfig.branch);
      if (result.success) {
        alert('Changes pushed successfully!');
        loadGitStatus();
      } else {
        alert(`Failed to push: ${result.message}`);
      }
    } catch (err) {
      setError(`Error pushing changes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
  const result = await apiClient.gitPull(repositoryPath, remoteConfig.remote, remoteConfig.branch);
      if (result.success) {
        alert('Changes pulled successfully!');
        loadGitStatus();
      } else {
        alert(`Failed to pull: ${result.message}`);
      }
    } catch (err) {
      setError(`Error pulling changes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // selection helpers removed (not currently used in UI)

  return (
    <>
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          📚 Git Integration
        </h2>
        <div className="space-x-2">
          <button
            onClick={handleAuthenticate}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            🔐 Authenticate
          </button>
          <button
            onClick={loadGitStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repository Management */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Management</h3>
          
          {/* Repository Path */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository Path:</label>
            <input
              type="text"
              value={repositoryPath}
              onChange={(e) => setRepositoryPath(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="."
            />
          </div>

          {/* Create Repository */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Create New Repository</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Repository name"
                value={repoForm.name}
                onChange={(e) => setRepoForm({...repoForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={repoForm.description}
                onChange={(e) => setRepoForm({...repoForm, description: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={repoForm.isPrivate}
                  onChange={(e) => setRepoForm({...repoForm, isPrivate: e.target.checked})}
                  className="mr-2"
                />
                Private repository
              </label>
              <button
                onClick={handleCreateRepository}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                Create Repository
              </button>
            </div>
          </div>

          {/* Clone Repository */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Clone Existing Repository</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Repository URL"
                value={repoForm.cloneUrl}
                onChange={(e) => setRepoForm({...repoForm, cloneUrl: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Local path"
                value={repoForm.localPath}
                onChange={(e) => setRepoForm({...repoForm, localPath: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleCloneRepository}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Clone Repository
              </button>
            </div>
          </div>

          {/* Initialize Repository */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Initialize Local Repository</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Local path"
                value={repoForm.localPath}
                onChange={(e) => setRepoForm({...repoForm, localPath: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Repository name"
                value={repoForm.name}
                onChange={(e) => setRepoForm({...repoForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleInitRepository}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                Initialize Repository
              </button>
            </div>
          </div>
        </div>

        {/* Git Operations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Git Operations</h3>
          
          {/* Commit Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Commit Changes</h4>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCommit}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                disabled={loading || !commitMessage}
              >
                Commit
              </button>
              <button
                onClick={handlePush}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Push
              </button>
              <button
                onClick={handlePull}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
                disabled={loading}
              >
                Pull
              </button>
            </div>
          </div>

          {/* File Status */}
          {gitStatus && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">File Status</h4>
              
              {gitStatus.modified && gitStatus.modified.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-orange-600 mb-1">
                    Modified ({gitStatus.modified.length})
                  </div>
                  <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                    {gitStatus.modified.slice(0, 5).map((file: string) => (
                      <div key={file}>{file}</div>
                    ))}
                    {gitStatus.modified.length > 5 && <div>... and {gitStatus.modified.length - 5} more</div>}
                  </div>
                </div>
              )}

              {gitStatus.untracked && gitStatus.untracked.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-red-600 mb-1">
                    Untracked ({gitStatus.untracked.length})
                  </div>
                  <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                    {gitStatus.untracked.slice(0, 5).map((file: string) => (
                      <div key={file}>{file}</div>
                    ))}
                    {gitStatus.untracked.length > 5 && <div>... and {gitStatus.untracked.length - 5} more</div>}
                  </div>
                </div>
              )}

              {gitStatus.staged && gitStatus.staged.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-green-600 mb-1">
                    Staged ({gitStatus.staged.length})
                  </div>
                  <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                    {gitStatus.staged.slice(0, 5).map((file: string) => (
                      <div key={file}>{file}</div>
                    ))}
                    {gitStatus.staged.length > 5 && <div>... and {gitStatus.staged.length - 5} more</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    
    <Modal
      open={deviceModalOpen}
      title="GitHub Device Authorization"
      onClose={() => {
        setDeviceModalOpen(false);
        pollingRef.current = false;
        setPollStatus(null);
        setCopyStatus('idle');
        if (eventSourceRef.current) {
          try { eventSourceRef.current.close(); } catch {};
          eventSourceRef.current = null;
        }
      }}
    >
      {githubDevice ? (
        <div>
          {pollStatus === 'authenticated' ? (
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">✔ Authorized</div>
              <div className="mt-2 text-sm text-gray-600">Token stored on the server. You can close this dialog.</div>
              <div className="mt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { setDeviceModalOpen(false); pollingRef.current = false; setPollStatus(null); }}>Close</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2">Open the following URL and enter the user code shown below:</div>
              <div className="mb-2 font-mono break-all">{githubDevice.verification_uri}</div>
              <div className="mb-2 font-mono text-lg font-semibold">{githubDevice.user_code}</div>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  className="px-3 py-1 bg-gray-200 rounded flex items-center"
                  onClick={() => handleCopy('code')}
                >
                  Copy Code
                  {copyStatus === 'code' && <span className="ml-2 text-green-600">✓</span>}
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded flex items-center"
                  onClick={() => handleCopy('url')}
                >
                  Copy URL
                  {copyStatus === 'url' && <span className="ml-2 text-green-600">✓</span>}
                </button>
                <button className="px-3 py-1 bg-red-100 rounded" onClick={() => { pollingRef.current = false; setDeviceModalOpen(false); setPollStatus(null); }}>Cancel</button>
                <div className="ml-2" aria-live="polite">
                  {(pollStatus === 'pending' || pollStatus === 'waiting') && (
                    <div className="inline-flex items-center text-sm text-gray-600">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
                      </svg>
                      Waiting for approval on GitHub...
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div>Status: <span className="font-medium">{pollStatus}</span></div>
                {pollStatus === 'pending' && <div className="text-yellow-600 mt-2">Waiting for user action on GitHub...</div>}
                {pollStatus === 'error' && <div className="text-red-600 mt-2">Authentication failed: {error}</div>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>Starting device authorization...</div>
      )}
    </Modal>
    </>
  );
};