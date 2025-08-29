import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface LSPServer {
  id: string;
  name: string;
  language: string;
  state: string;
  capabilities: {
    completion: boolean;
    hover: boolean;
    diagnostics: boolean;
    debug_support: boolean;
  };
}

interface Completion {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

export const LSPIntegration: React.FC = () => {
  const [servers, setServers] = useState<LSPServer[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [position, setPosition] = useState({ line: 0, character: 0 });
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getLSPServers();
      setServers(response);
    } catch (err) {
      setError(`Failed to load LSP servers: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getCodeCompletion = async () => {
    if (!selectedFile) {
      alert('Please specify a file path');
      return;
    }

    try {
      const response = await apiClient.getCodeCompletion(selectedFile, position, selectedLanguage);
      setCompletions(response.completions || []);
    } catch (err) {
      alert(`Failed to get code completion: ${err}`);
    }
  };

  const getHoverInfo = async () => {
    if (!selectedFile) {
      alert('Please specify a file path');
      return;
    }

    try {
      const response = await apiClient.getHoverInfo(selectedFile, position, selectedLanguage);
      setHoverInfo(response.hover_info);
    } catch (err) {
      alert(`Failed to get hover info: ${err}`);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'running': return '✅';
      case 'starting': return '🔄';
      case 'stopped': return '⏹️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'text-green-600';
      case 'starting': return 'text-blue-600';
      case 'stopped': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getCompletionKindIcon = (kind: number) => {
    // LSP CompletionItemKind mapping
    switch (kind) {
      case 1: return '📝'; // Text
      case 2: return '🔧'; // Method
      case 3: return '⚙️'; // Function
      case 4: return '🏗️'; // Constructor
      case 5: return '🏷️'; // Field
      case 6: return '📦'; // Variable
      case 7: return '📚'; // Class
      case 8: return '🔗'; // Interface
      case 9: return '📁'; // Module
      case 10: return '🔢'; // Property
      case 11: return '🔢'; // Unit
      case 12: return '💎'; // Value
      case 13: return '📋'; // Enum
      case 14: return '🔑'; // Keyword
      case 15: return '📄'; // Snippet
      case 16: return '🎨'; // Color
      case 17: return '📁'; // File
      case 18: return '📚'; // Reference
      case 19: return '📁'; // Folder
      case 20: return '📋'; // EnumMember
      case 21: return '🔢'; // Constant
      case 22: return '🏗️'; // Struct
      case 23: return '🎯'; // Event
      case 24: return '⚡'; // Operator
      case 25: return '🔧'; // TypeParameter
      default: return '📝';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🔧 LSP Integration
        </h2>
        <button
          onClick={loadServers}
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
        {/* Server Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Servers</h3>
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStateIcon(server.state)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{server.name}</h4>
                      <p className="text-sm text-gray-600">{server.language}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getStateColor(server.state)}`}>
                    {server.state}
                  </span>
                </div>

                {/* Capabilities */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Capabilities:</h5>
                  <div className="flex flex-wrap gap-2">
                    {server.capabilities.completion && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        ✨ Completion
                      </span>
                    )}
                    {server.capabilities.hover && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                        💡 Hover
                      </span>
                    )}
                    {server.capabilities.diagnostics && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                        🔍 Diagnostics
                      </span>
                    )}
                    {server.capabilities.debug_support && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                        🐛 Debug
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {servers.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🔧</div>
              <p className="text-gray-600">No language servers available</p>
              <p className="text-sm text-gray-500 mt-1">
                Install language servers like pylsp, typescript-language-server, or rust-analyzer
              </p>
            </div>
          )}
        </div>

        {/* LSP Features Testing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test LSP Features</h3>
          
          {/* File and Position Input */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-3">File and Position</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Path:</label>
                <input
                  type="text"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/your/file.py"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line:</label>
                  <input
                    type="number"
                    value={position.line}
                    onChange={(e) => setPosition({ ...position, line: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Character:</label>
                  <input
                    type="number"
                    value={position.character}
                    onChange={(e) => setPosition({ ...position, character: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mb-4">
            <button
              onClick={getCodeCompletion}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ✨ Get Completions
            </button>
            <button
              onClick={getHoverInfo}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              💡 Get Hover Info
            </button>
          </div>

          {/* Completions Results */}
          {completions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Code Completions</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {completions.map((completion, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getCompletionKindIcon(completion.kind)}</span>
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {completion.label}
                        </span>
                      </div>
                      {completion.detail && (
                        <div className="text-xs text-gray-600 mb-1">{completion.detail}</div>
                      )}
                      {completion.documentation && (
                        <div className="text-xs text-gray-500">{completion.documentation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hover Info Results */}
          {hoverInfo && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Hover Information</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="bg-white p-3 rounded border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{hoverInfo}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure the file exists and contains valid code</li>
              <li>• Position is 0-based (line 0 = first line)</li>
              <li>• Language servers need to be running for features to work</li>
              <li>• Completions work best at end of identifiers or after dots</li>
              <li>• Hover info shows type information and documentation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};