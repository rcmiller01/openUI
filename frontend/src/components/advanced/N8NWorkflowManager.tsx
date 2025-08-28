import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';

interface Workflow {
  id: string;
  name: string;
  status: string;
  description?: string;
  lastExecuted?: string;
  totalExecutions?: number;
}

interface ExecutionResult {
  execution_id?: string;
  error?: string;
  status?: string;
}

export const N8NWorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [executionData, setExecutionData] = useState<string>('{}');
  const [gitForm, setGitForm] = useState({
    repositoryPath: '.',
    commitMessage: '',
    files: ''
  });
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new ApiClient('http://127.0.0.1:8000');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getN8NWorkflows();
      setWorkflows(response);
    } catch (err) {
      setError(`Failed to load n8n workflows: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string, data: Record<string, any> = {}) => {
    try {
      const result = await apiClient.executeN8NWorkflow(workflowId, data);
      setExecutionResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      return result;
    } catch (err) {
      const errorResult = { error: `Failed to execute workflow: ${err}` };
      setExecutionResults(prev => [errorResult, ...prev.slice(0, 9)]);
      return errorResult;
    }
  };

  const executeSelectedWorkflow = async () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow');
      return;
    }

    let data = {};
    try {
      data = JSON.parse(executionData);
    } catch (err) {
      alert('Invalid JSON in execution data');
      return;
    }

    await executeWorkflow(selectedWorkflow, data);
  };

  const triggerGitCommitWorkflow = async () => {
    if (!gitForm.commitMessage) {
      alert('Please enter a commit message');
      return;
    }

    const files = gitForm.files.split(',').map(f => f.trim()).filter(f => f);
    
    try {
      const result = await apiClient.gitCommitViaN8N(
        gitForm.repositoryPath,
        gitForm.commitMessage,
        files
      );
      setExecutionResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (err) {
      const errorResult = { error: `Failed to trigger git commit workflow: ${err}` };
      setExecutionResults(prev => [errorResult, ...prev.slice(0, 9)]);
    }
  };

  const setupGitAutomation = async () => {
    try {
      const result = await apiClient.setupGitAutomation(gitForm.repositoryPath);
      setExecutionResults(prev => [result, ...prev.slice(0, 9)]);
      alert(`Git automation setup: ${result.status || 'completed'}`);
    } catch (err) {
      alert(`Failed to setup git automation: ${err}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '⏸️';
      case 'error': return '❌';
      case 'paused': return '⏸️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      case 'error': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const formatExecutionData = (data: string) => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🔄 n8n Workflow Manager
        </h2>
        <button
          onClick={loadWorkflows}
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
        {/* Workflows List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Workflows</h3>
          
          <div className="space-y-3 mb-6">
            {workflows.map((workflow) => (
              <div 
                key={workflow.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflow === workflow.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedWorkflow(workflow.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getStatusIcon(workflow.status)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                      <p className="text-sm text-gray-600">{workflow.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                    {workflow.totalExecutions !== undefined && (
                      <div className="text-xs text-gray-500">
                        {workflow.totalExecutions} executions
                      </div>
                    )}
                  </div>
                </div>
                
                {workflow.lastExecuted && (
                  <div className="text-xs text-gray-500">
                    Last executed: {new Date(workflow.lastExecuted).toLocaleString()}
                  </div>
                )}
                
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    executeWorkflow(workflow.id); 
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  ▶️ Execute
                </button>
              </div>
            ))}
          </div>

          {workflows.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🔄</div>
              <p className="text-gray-600">No workflows found</p>
              <p className="text-sm text-gray-500 mt-1">
                Check your n8n server at http://192.168.50.145:5678/
              </p>
            </div>
          )}
        </div>

        {/* Workflow Execution & Git Integration */}
        <div className="space-y-6">
          {/* Manual Workflow Execution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execute Workflow</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Workflow:
                </label>
                <div className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">
                  {selectedWorkflow || 'None selected'}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Data (JSON):
                </label>
                <textarea
                  value={executionData}
                  onChange={(e) => setExecutionData(e.target.value)}
                  className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>

              <button
                onClick={executeSelectedWorkflow}
                disabled={!selectedWorkflow}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                🚀 Execute Selected Workflow
              </button>
            </div>
          </div>

          {/* Git Integration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Git Integration</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Path:
                  </label>
                  <input
                    type="text"
                    value={gitForm.repositoryPath}
                    onChange={(e) => setGitForm({ ...gitForm, repositoryPath: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commit Message:
                  </label>
                  <input
                    type="text"
                    value={gitForm.commitMessage}
                    onChange={(e) => setGitForm({ ...gitForm, commitMessage: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Update files via n8n workflow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Files (comma-separated, optional):
                  </label>
                  <input
                    type="text"
                    value={gitForm.files}
                    onChange={(e) => setGitForm({ ...gitForm, files: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="file1.py, file2.js, src/"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={triggerGitCommitWorkflow}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    📝 Commit via n8n
                  </button>
                  <button
                    onClick={setupGitAutomation}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    ⚙️ Setup Automation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Results */}
          {executionResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
              
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {executionResults.map((result, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Execution #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {result.execution_id && (
                        <div className="text-sm text-green-600 mb-1">
                          ✅ Execution ID: {result.execution_id}
                        </div>
                      )}
                      
                      {result.workflow_id && (
                        <div className="text-sm text-blue-600 mb-1">
                          🔄 Workflow ID: {result.workflow_id}
                        </div>
                      )}
                      
                      {result.status && (
                        <div className="text-sm text-gray-600 mb-1">
                          Status: {result.status}
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="text-sm text-red-600">
                          ❌ Error: {result.error}
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
        <h4 className="font-medium text-blue-900 mb-2">💡 n8n Integration Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Execute workflows manually or via automation</li>
          <li>• Git integration for automated commits and CI/CD</li>
          <li>• Real-time workflow status monitoring</li>
          <li>• Custom data passing to workflow executions</li>
          <li>• Setup automation workflows for repository management</li>
          <li>• Connected to n8n server at http://192.168.50.145:5678/</li>
        </ul>
      </div>
    </div>
  );
};