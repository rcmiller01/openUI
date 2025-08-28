import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';

interface DebugSession {
  id: string;
  language: string;
  file_path: string;
  state: string;
  breakpoints_count: number;
  breakpoints: Array<{
    id: string;
    file_path: string;
    line: number;
    enabled: boolean;
    condition?: string;
  }>;
}

interface Variable {
  name: string;
  value: string;
  type: string;
  evaluatable: boolean;
  children?: Variable[];
}

interface StackFrame {
  id: string;
  name: string;
  file_path: string;
  line: number;
  column: number;
}

export const DebugPanel: React.FC = () => {
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [stackFrames, setStackFrames] = useState<StackFrame[]>([]);
  const [newSessionForm, setNewSessionForm] = useState({
    filePath: '',
    language: 'python'
  });
  const [breakpointForm, setBreakpointForm] = useState({
    filePath: '',
    line: 1,
    condition: ''
  });
  const [evaluateExpression, setEvaluateExpression] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new ApiClient('http://127.0.0.1:8000');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getDebugSessions();
      setSessions(response);
    } catch (err) {
      setError(`Failed to load debug sessions: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async () => {
    if (!selectedSession) return;
    
    try {
      // Load variables and stack trace for the selected session
      const [variablesData, stackData] = await Promise.all([
        apiClient.getVariables(selectedSession),
        apiClient.getStackTrace(selectedSession)
      ]);
      setVariables(variablesData);
      setStackFrames(stackData);
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const startDebugSession = async () => {
    if (!newSessionForm.filePath) {
      alert('Please specify a file path');
      return;
    }

    try {
      const sessionId = await apiClient.startDebugSession(
        newSessionForm.filePath,
        newSessionForm.language
      );
      if (sessionId) {
        setSelectedSession(sessionId);
        loadSessions();
        setNewSessionForm({ filePath: '', language: 'python' });
      }
    } catch (err) {
      alert(`Failed to start debug session: ${err}`);
    }
  };

  const stopDebugSession = async (sessionId: string) => {
    try {
      await apiClient.stopDebugSession(sessionId);
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setVariables([]);
        setStackFrames([]);
      }
      loadSessions();
    } catch (err) {
      alert(`Failed to stop debug session: ${err}`);
    }
  };

  const setBreakpoint = async () => {
    if (!selectedSession || !breakpointForm.filePath || !breakpointForm.line) {
      alert('Please select a session and specify breakpoint details');
      return;
    }

    try {
      const breakpointId = await apiClient.setBreakpoint(
        selectedSession,
        breakpointForm.filePath,
        breakpointForm.line,
        breakpointForm.condition || undefined
      );
      if (breakpointId) {
        loadSessions();
        setBreakpointForm({ filePath: '', line: 1, condition: '' });
      }
    } catch (err) {
      alert(`Failed to set breakpoint: ${err}`);
    }
  };

  const continueExecution = async () => {
    if (!selectedSession) return;
    try {
      await apiClient.continueExecution(selectedSession);
      loadSessionDetails();
    } catch (err) {
      alert(`Failed to continue execution: ${err}`);
    }
  };

  const stepOver = async () => {
    if (!selectedSession) return;
    try {
      await apiClient.stepOver(selectedSession);
      loadSessionDetails();
    } catch (err) {
      alert(`Failed to step over: ${err}`);
    }
  };

  const stepInto = async () => {
    if (!selectedSession) return;
    try {
      await apiClient.stepInto(selectedSession);
      loadSessionDetails();
    } catch (err) {
      alert(`Failed to step into: ${err}`);
    }
  };

  const stepOut = async () => {
    if (!selectedSession) return;
    try {
      await apiClient.stepOut(selectedSession);
      loadSessionDetails();
    } catch (err) {
      alert(`Failed to step out: ${err}`);
    }
  };

  const evaluateExpressionInDebugger = async () => {
    if (!selectedSession || !evaluateExpression) return;
    
    try {
      const result = await apiClient.evaluateExpression(selectedSession, evaluateExpression);
      setEvaluationResult(result);
    } catch (err) {
      alert(`Failed to evaluate expression: ${err}`);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'running': return '▶️';
      case 'paused': return '⏸️';
      case 'stopped': return '⏹️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'stopped': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🐛 Debug Panel
        </h2>
        <button
          onClick={loadSessions}
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
        {/* Session Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Debug Sessions</h3>
          
          {/* New Session Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Start New Session</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Path:</label>
                <input
                  type="text"
                  value={newSessionForm.filePath}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, filePath: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/your/file.py"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language:</label>
                <select
                  value={newSessionForm.language}
                  onChange={(e) => setNewSessionForm({ ...newSessionForm, language: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                </select>
              </div>
              <button
                onClick={startDebugSession}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🚀 Start Session
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="space-y-2">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSession === session.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStateIcon(session.state)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{session.language}</div>
                      <div className="text-sm text-gray-600 truncate">{session.file_path}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStateColor(session.state)}`}>
                      {session.state}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); stopDebugSession(session.id); }}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>
                  </div>
                </div>
                {session.breakpoints_count > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {session.breakpoints_count} breakpoint(s)
                  </div>
                )}
              </div>
            ))}
          </div>

          {sessions.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🐛</div>
              <p className="text-gray-600">No active debug sessions</p>
            </div>
          )}
        </div>

        {/* Debug Controls & Information */}
        <div className="space-y-4">
          {selectedSession && (
            <>
              <h3 className="text-lg font-semibold text-gray-900">Debug Controls</h3>
              
              {/* Control Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={continueExecution}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  ▶️ Continue
                </button>
                <button
                  onClick={stepOver}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  ⏭️ Step Over
                </button>
                <button
                  onClick={stepInto}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  ⬇️ Step Into
                </button>
                <button
                  onClick={stepOut}
                  className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  ⬆️ Step Out
                </button>
              </div>

              {/* Breakpoint Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Set Breakpoint</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Path:</label>
                    <input
                      type="text"
                      value={breakpointForm.filePath}
                      onChange={(e) => setBreakpointForm({ ...breakpointForm, filePath: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Line:</label>
                      <input
                        type="number"
                        value={breakpointForm.line}
                        onChange={(e) => setBreakpointForm({ ...breakpointForm, line: parseInt(e.target.value) || 1 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition (optional):</label>
                      <input
                        type="text"
                        value={breakpointForm.condition}
                        onChange={(e) => setBreakpointForm({ ...breakpointForm, condition: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="x > 10"
                      />
                    </div>
                  </div>
                  <button
                    onClick={setBreakpoint}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    🔴 Set Breakpoint
                  </button>
                </div>
              </div>

              {/* Expression Evaluation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Evaluate Expression</h4>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={evaluateExpression}
                      onChange={(e) => setEvaluateExpression(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="variable_name or expression"
                      onKeyPress={(e) => e.key === 'Enter' && evaluateExpressionInDebugger()}
                    />
                    <button
                      onClick={evaluateExpressionInDebugger}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ▶️
                    </button>
                  </div>
                  {evaluationResult && (
                    <div className="bg-white p-3 border rounded-md">
                      <pre className="text-sm text-gray-800">{JSON.stringify(evaluationResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Variables */}
              {variables.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Variables</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                    {variables.map((variable, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium text-gray-900">{variable.name}</span>
                          <span className="text-xs text-gray-500">{variable.type}</span>
                        </div>
                        <div className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                          {variable.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {stackFrames.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Stack Trace</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                    {stackFrames.map((frame, index) => (
                      <div key={frame.id} className="mb-2 last:mb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium text-gray-900">{frame.name}</span>
                          <span className="text-xs text-gray-500">#{index}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {frame.file_path}:{frame.line}:{frame.column}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedSession && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🎯</div>
              <p className="text-gray-600">Select a debug session to view controls</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};