import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Agent {
  id: string;
  type: string;
  status: string;
  name: string;
  currentTask?: string;
  progress?: number;
  lastResult?: any;
  error?: string;
  capabilities: string[];
  performance_score: number;
  load: number;
}

interface Task {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  assigned_agent?: string;
  created_at: string;
  completed_at?: string;
  dependencies?: string[];
  result?: any;
  error?: string;
}

interface SystemMetrics {
  total_tasks: number;
  completed_tasks: number;
  running_tasks: number;
  failed_tasks: number;
  success_rate: number;
  average_completion_time: number;
  agent_utilization: number;
}

export const AgentCoordination: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({
    type: 'analysis',
    description: '',
    priority: 'normal',
    dependencies: ''
  });
  const [newWorkflowForm, setNewWorkflowForm] = useState({
    name: '',
    tasks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoordinationStatus();
    const interval = setInterval(loadCoordinationStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCoordinationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getCoordinationStatus();
      setAgents(response.agents || []);
      setMetrics(response.metrics || null);
      
      // Load additional task/workflow data if available
      // Note: These endpoints might need to be added to the backend
      // For now, we'll use mock data or handle gracefully
    } catch (err) {
      setError(`Failed to load coordination status: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async () => {
    if (!newTaskForm.description) {
      alert('Please enter a task description');
      return;
    }

    try {
      const dependencies = newTaskForm.dependencies 
        ? newTaskForm.dependencies.split(',').map(d => d.trim()).filter(d => d)
        : undefined;

      const result = await apiClient.submitCoordinationTask(
        newTaskForm.type,
        newTaskForm.description,
        newTaskForm.priority,
        dependencies
      );

      if (result.task_id) {
        // Add to local tasks list (in real implementation, this would refresh from backend)
        const newTask: Task = {
          id: result.task_id,
          type: newTaskForm.type,
          description: newTaskForm.description,
          status: 'pending',
          priority: newTaskForm.priority,
          created_at: new Date().toISOString(),
          dependencies
        };
        setTasks(prev => [newTask, ...prev]);
        
        // Clear form
        setNewTaskForm({
          type: 'analysis',
          description: '',
          priority: 'normal',
          dependencies: ''
        });
        
        alert(`Task submitted successfully! ID: ${result.task_id}`);
      }
    } catch (err) {
      alert(`Failed to submit task: ${err}`);
    }
  };

  const submitWorkflow = async () => {
    if (!newWorkflowForm.name || !newWorkflowForm.tasks) {
      alert('Please enter workflow name and tasks');
      return;
    }

    try {
      const tasks = newWorkflowForm.tasks.split('\n').map(task => task.trim()).filter(task => task);
      
      // Submit each task individually
      const results = await Promise.all(
        tasks.map((task) => 
          apiClient.submitCoordinationTask(
            'general',
            task,
            'normal',
            [],
            { workflow_name: newWorkflowForm.name }
          )
        )
      );
      
      const result = results[0]; // Use first result for now

      if (result.workflow_id) {
        // Workflow submitted successfully
        
        // Clear form
        setNewWorkflowForm({ name: '', tasks: '' });
        
        alert(`Workflow submitted successfully! ID: ${result.workflow_id}`);
      }
    } catch (err) {
      alert(`Failed to submit workflow: ${err}`);
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'busy': return '🔄';
      case 'idle': return '😴';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'busy': return 'text-blue-600';
      case 'idle': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🤖 Agent Coordination
        </h2>
        <button
          onClick={loadCoordinationStatus}
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

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.total_tasks}</div>
            <div className="text-sm text-blue-700">Total Tasks</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.completed_tasks}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.running_tasks}</div>
            <div className="text-sm text-orange-700">Running</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(metrics.success_rate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-700">Success Rate</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Agents</h3>
          
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getAgentStatusIcon(agent.status)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                      <span className={`text-sm font-medium ${getAgentStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className={`font-bold ${getPerformanceColor(agent.performance_score)}`}>
                      {(agent.performance_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-500">Performance</div>
                  </div>
                </div>

                {/* Load Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Load</span>
                    <span>{(agent.load * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${agent.load > 0.8 ? 'bg-red-500' : agent.load > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${agent.load * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Task */}
                {agent.currentTask && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Current Task:</div>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {agent.currentTask}
                    </div>
                  </div>
                )}

                {/* Capabilities */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {agents.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🤖</div>
              <p className="text-gray-600">No active agents</p>
            </div>
          )}
        </div>

        {/* Task & Workflow Management */}
        <div className="space-y-6">
          {/* Submit New Task */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Task</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type:</label>
                  <select
                    value={newTaskForm.type}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="analysis">Analysis</option>
                    <option value="code_generation">Code Generation</option>
                    <option value="testing">Testing</option>
                    <option value="refactoring">Refactoring</option>
                    <option value="documentation">Documentation</option>
                    <option value="debugging">Debugging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                    className="w-full h-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the task to be performed..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority:</label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies:</label>
                    <input
                      type="text"
                      value={newTaskForm.dependencies}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, dependencies: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="task_1, task_2"
                    />
                  </div>
                </div>

                <button
                  onClick={submitTask}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  🚀 Submit Task
                </button>
              </div>
            </div>
          </div>

          {/* Submit Workflow */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Workflow</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name:</label>
                  <input
                    type="text"
                    value={newWorkflowForm.name}
                    onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Code Review Workflow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tasks (one per line):</label>
                  <textarea
                    value={newWorkflowForm.tasks}
                    onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, tasks: e.target.value })}
                    className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Analyze code quality
Run unit tests
Check for security issues
Generate documentation"
                  />
                </div>

                <button
                  onClick={submitWorkflow}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  🔄 Submit Workflow
                </button>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          {tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
              
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTaskStatusIcon(task.status)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {task.type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        {task.description}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {task.id}</span>
                        <span>{new Date(task.created_at).toLocaleString()}</span>
                      </div>

                      {task.assigned_agent && (
                        <div className="text-xs text-blue-600 mt-1">
                          Assigned to: {task.assigned_agent}
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
        <h4 className="font-medium text-blue-900 mb-2">🤖 Agent Coordination Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Real-time agent status and performance monitoring</li>
          <li>• Task submission with priority and dependency management</li>
          <li>• Workflow orchestration for complex multi-step processes</li>
          <li>• Load balancing and intelligent task assignment</li>
          <li>• System metrics and success rate tracking</li>
          <li>• Agent capability-based task routing</li>
        </ul>
      </div>
    </div>
  );
};