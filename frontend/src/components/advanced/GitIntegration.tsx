import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface GitStatus {
  branch?: string;
  staged?: string[];
  modified?: string[];
  untracked?: string[];
  ahead?: number;
  behind?: number;
}

interface GitOperation {
  id: string;
  operation: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  method: 'mcp' | 'n8n';
  timestamp: string;
  result?: any;
  error?: string;
}

export const GitIntegration: React.FC = () => {
  const [gitStatus, setGitStatus] = useState<GitStatus>({});
  const [operations, setOperations] = useState<GitOperation[]>([]);
  const [repositoryPath, setRepositoryPath] = useState('.');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [useN8N, setUseN8N] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState({
    remote: 'origin',
    branch: 'main'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGitStatus();
  }, [repositoryPath]);

  const loadGitStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await apiClient.getGitStatus(repositoryPath);
      setGitStatus(status);
    } catch (err) {
      setError(`Failed to load git status: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const addOperation = (operation: string, method: 'mcp' | 'n8n', result?: any, error?: string) => {
    const newOperation: GitOperation = {
      id: Date.now().toString(),
      operation,
      status: error ? 'failed' : 'completed',
      method,
      timestamp: new Date().toISOString(),
      result,
      error
    };
    setOperations(prev => [newOperation, ...prev.slice(0, 9)]);
  };

  const commitChanges = async () => {
    if (!commitMessage) {
      alert('Please enter a commit message');
      return;
    }

    try {
      const result = await apiClient.gitCommit(
        repositoryPath,
        commitMessage,
        selectedFiles.length > 0 ? selectedFiles : undefined,
        useN8N
      );
      
      addOperation(
        `Commit: ${commitMessage}`,
        result.method as 'mcp' | 'n8n',
        result
      );
      
      // Refresh git status after commit
      loadGitStatus();
      
      // Clear form
      setCommitMessage('');
      setSelectedFiles([]);
      
    } catch (err) {
      addOperation(`Commit: ${commitMessage}`, useN8N ? 'n8n' : 'mcp', undefined, err as string);
    }
  };

  const pushChanges = async () => {
    try {
      const result = await apiClient.gitPush(
        repositoryPath,
        remoteConfig.remote,
        remoteConfig.branch
      );
      
      addOperation(
        `Push to ${remoteConfig.remote}/${remoteConfig.branch}`,
        'mcp',
        result
      );
      
      loadGitStatus();
      
    } catch (err) {
      addOperation(`Push to ${remoteConfig.remote}/${remoteConfig.branch}`, 'mcp', undefined, err as string);
    }
  };

  const pullChanges = async () => {
    try {
      const result = await apiClient.gitPull(
        repositoryPath,
        remoteConfig.remote,
        remoteConfig.branch
      );
      
      addOperation(
        `Pull from ${remoteConfig.remote}/${remoteConfig.branch}`,
        'mcp',
        result
      );
      
      loadGitStatus();
      
    } catch (err) {
      addOperation(`Pull from ${remoteConfig.remote}/${remoteConfig.branch}`, 'mcp', undefined, err as string);
    }
  };

  const toggleFileSelection = (file: string) => {
    setSelectedFiles(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };

  const selectAllModified = () => {
    const allModified = [...(gitStatus.modified || []), ...(gitStatus.untracked || [])];
    setSelectedFiles(allModified);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getMethodBadge = (method: string) => {
    return method === 'n8n' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          📚 Git Integration
        </h2>
        <button
          onClick={loadGitStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repository Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Status</h3>
          
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

          {/* Branch Info */}
          {gitStatus.branch && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Current Branch</h4>
                <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {gitStatus.branch}
                </span>
              </div>
              
              {(gitStatus.ahead || gitStatus.behind) && (
                <div className="flex items-center space-x-4 text-sm">
                  {gitStatus.ahead && (
                    <span className="text-green-600">
                      ↑ {gitStatus.ahead} ahead
                    </span>
                  )}
                  {gitStatus.behind && (
                    <span className="text-orange-600">
                      ↓ {gitStatus.behind} behind
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Status */}
          <div className="space-y-4">
            {/* Staged Files */}
            {gitStatus.staged && gitStatus.staged.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded mr-2"></span>
                  Staged ({gitStatus.staged.length})
                </h4>
                <div className="bg-green-50 p-3 rounded-lg">
                  {gitStatus.staged.map((file) => (
                    <div key={file} className="text-sm text-green-800 font-mono">
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified Files */}
            {gitStatus.modified && gitStatus.modified.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded mr-2"></span>
                  Modified ({gitStatus.modified.length})
                </h4>
                <div className="bg-orange-50 p-3 rounded-lg space-y-1">
                  {gitStatus.modified.map((file) => (
                    <div key={file} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file)}
                        onChange={() => toggleFileSelection(file)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-orange-800 font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Untracked Files */}
            {gitStatus.untracked && gitStatus.untracked.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded mr-2"></span>
                  Untracked ({gitStatus.untracked.length})
                </h4>
                <div className="bg-red-50 p-3 rounded-lg space-y-1">
                  {gitStatus.untracked.map((file) => (
                    <div key={file} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file)}
                        onChange={() => toggleFileSelection(file)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-red-800 font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Selection Actions */}
            {((gitStatus.modified && gitStatus.modified.length > 0) || 
              (gitStatus.untracked && gitStatus.untracked.length > 0)) && (
              <div className="flex space-x-2">
                <button
                  onClick={selectAllModified}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Clean Working Directory */}
          {(!gitStatus.modified || gitStatus.modified.length === 0) && 
           (!gitStatus.untracked || gitStatus.untracked.length === 0) && 
           (!gitStatus.staged || gitStatus.staged.length === 0) && (
            <div className="text-center py-8">
              <div className="text-green-400 text-4xl mb-2">✨</div>
              <p className="text-gray-600">Working directory clean</p>
            </div>
          )}
        </div>

        {/* Git Operations */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Git Operations</h3>
          
          {/* Commit Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Commit Changes</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commit Message:
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Update files"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useN8N"
                  checked={useN8N}
                  onChange={(e) => setUseN8N(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useN8N" className="text-sm text-gray-700">
                  Use n8n workflow (automated commit)
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  Selected files: {selectedFiles.length}
                </div>
              )}

              <button
                onClick={commitChanges}
                disabled={!commitMessage}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                📝 Commit Changes
              </button>
            </div>
          </div>

          {/* Remote Operations */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Remote Operations</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remote:</label>
                  <input
                    type="text"
                    value={remoteConfig.remote}
                    onChange={(e) => setRemoteConfig({ ...remoteConfig, remote: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch:</label>
                  <input
                    type="text"
                    value={remoteConfig.branch}
                    onChange={(e) => setRemoteConfig({ ...remoteConfig, branch: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={pushChanges}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  ⬆️ Push
                </button>
                <button
                  onClick={pullChanges}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  ⬇️ Pull
                </button>
              </div>
            </div>
          </div>

          {/* Recent Operations */}
          {operations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Operations</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {operations.map((operation) => (
                    <div key={operation.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(operation.status)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {operation.operation}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodBadge(operation.method)}`}>
                          {operation.method.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className={getStatusColor(operation.status)}>
                          {operation.status}
                        </span>
                        <span>
                          {new Date(operation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {operation.error && (
                        <div className="mt-2 text-xs text-red-600">
                          Error: {operation.error}
                        </div>
                      )}

                      {operation.result && (
                        <div className="mt-2 text-xs text-green-600">
                          {operation.result.execution_id && `Execution ID: ${operation.result.execution_id}`}
                          {operation.result.status && ` | Status: ${operation.result.status}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Git Integration Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Real-time repository status monitoring</li>
          <li>• Commit changes via MCP (direct) or n8n (workflow automation)</li>
          <li>• Selective file staging and commit</li>
          <li>• Push/pull operations with configurable remotes</li>
          <li>• Operation history with method tracking</li>
          <li>• Branch and sync status information</li>
        </ul>
      </div>
    </div>
  );
};