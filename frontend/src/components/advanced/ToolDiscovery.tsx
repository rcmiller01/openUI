import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
  usage_count: number;
  last_used: string | null;
}

interface ToolAnalytics {
  total_tools: number;
  total_usages: number;
  most_used_tools: Array<{
    id: string;
    name: string;
    usage_count: number;
  }>;
  by_category: Record<string, number>;
}

export const ToolDiscovery: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [analytics, setAnalytics] = useState<ToolAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
    loadAnalytics();
  }, [selectedCategory]);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the correct API method - getAvailableTools should be implemented in api.ts
      const response = await apiClient.getAvailableTools();
      setTools(response);
    } catch (err) {
      setError(`Failed to load tools: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await apiClient.getToolAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const invokeTool = async (toolId: string, capability: string, parameters: Record<string, any> = {}) => {
    try {
      const result = await apiClient.invokeTool(toolId, capability, parameters);
      console.log('Tool result:', result);
      // Refresh analytics after tool invocation
      loadAnalytics();
      alert(`Tool executed successfully: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      alert(`Tool execution failed: ${err}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lsp': return '🔧';
      case 'mcp': return '🔗';
      case 'n8n': return '🔄';
      case 'debug': return '🐛';
      case 'native': return '⚙️';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lsp': return 'bg-blue-100 text-blue-800';
      case 'mcp': return 'bg-green-100 text-green-800';
      case 'n8n': return 'bg-purple-100 text-purple-800';
      case 'debug': return 'bg-red-100 text-red-800';
      case 'native': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🛠️ Tool Discovery
        </h2>
        <button
          onClick={() => { loadTools(); loadAnalytics(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.total_tools}</div>
            <div className="text-sm text-blue-700">Total Tools</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.total_usages}</div>
            <div className="text-sm text-green-700">Total Usages</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(analytics.by_category).length}</div>
            <div className="text-sm text-purple-700">Categories</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.most_used_tools.length > 0 ? analytics.most_used_tools[0].usage_count : 0}
            </div>
            <div className="text-sm text-orange-700">Most Used</div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="lsp">LSP Tools</option>
          <option value="mcp">MCP Tools</option>
          <option value="n8n">n8n Workflows</option>
          <option value="debug">Debug Tools</option>
          <option value="native">Native Tools</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTypeIcon(tool.type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(tool.type)}`}>
                    {tool.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Used: {tool.usage_count}</div>
                {tool.last_used && (
                  <div className="text-xs">
                    {new Date(tool.last_used).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{tool.description}</p>

            {/* Capabilities */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Capabilities:</h4>
              <div className="flex flex-wrap gap-1">
                {tool.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {tool.capabilities.map((capability) => (
                <button
                  key={capability}
                  onClick={() => invokeTool(tool.id, capability)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {capability}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tools.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all' 
              ? 'No tools are currently available. Check your integrations.'
              : `No tools found in the ${selectedCategory} category.`
            }
          </p>
        </div>
      )}
    </div>
  );
};