import React, { useState } from 'react';
import { ToolDiscovery } from './ToolDiscovery';
import { DebugPanel } from './DebugPanel';
import { LSPIntegration } from './LSPIntegration';
import { N8NWorkflowManager } from './N8NWorkflowManager';
import { GitIntegration } from './GitIntegration';
import { AgentCoordination } from './AgentCoordination';
import { ProxmoxContainerManager } from './ProxmoxContainerManager';

export const AdvancedToolsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tools');

  const tabs = [
    { id: 'tools', label: '🛠️ Tools', component: <ToolDiscovery /> },
    { id: 'debug', label: '🐛 Debug', component: <DebugPanel /> },
    { id: 'lsp', label: '🔧 LSP', component: <LSPIntegration /> },
    { id: 'n8n', label: '🔄 n8n', component: <N8NWorkflowManager /> },
    { id: 'git', label: '📚 Git', component: <GitIntegration /> },
    { id: 'agents', label: '🤖 Agents', component: <AgentCoordination /> },
    { id: 'containers', label: '🐳 Containers', component: <ProxmoxContainerManager /> }
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Tools Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage enhanced capabilities including debugging, language servers, workflow automation, and agent coordination.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-200 ease-in-out">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('tools')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🛠️</div>
            <div className="font-medium text-gray-900">Discover Tools</div>
            <div className="text-sm text-gray-600 mt-1">Explore available capabilities</div>
          </button>
          
          <button
            onClick={() => setActiveTab('debug')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🐛</div>
            <div className="font-medium text-gray-900">Debug Code</div>
            <div className="text-sm text-gray-600 mt-1">Start debugging sessions</div>
          </button>
          
          <button
            onClick={() => setActiveTab('containers')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">�</div>
            <div className="font-medium text-gray-900">Container Manager</div>
            <div className="text-sm text-gray-600 mt-1">Manage Proxmox containers</div>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 font-bold text-xl">✅</div>
            <div className="text-sm text-gray-600 mt-1">Backend Connected</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 font-bold text-xl">🔄</div>
            <div className="text-sm text-gray-600 mt-1">Integrations Active</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 font-bold text-xl">🤖</div>
            <div className="text-sm text-gray-600 mt-1">Agents Ready</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 font-bold text-xl">🔧</div>
            <div className="text-sm text-gray-600 mt-1">Tools Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};