/**
 * API Client for Open-Deep-Coder Frontend
 * 
 * Handles communication with the backend API and WebSocket connections.
 */

import { ChatMessage, LLMModel } from '../store';

const API_BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  context?: Record<string, any>;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  model: string;
  tokens: number;
  finish_reason: string;
  context?: Record<string, any>;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: string;
  is_directory: boolean;
  permissions: string[];
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  modified: string;
}

class ApiClient {
  private ws: WebSocket | null = null;
  private wsCallbacks: Map<string, (data: any) => void> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callback = this.wsCallbacks.get(data.type);
          if (callback) {
            callback(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.initWebSocket();
    }, 3000);
  }

  public onWebSocketMessage(type: string, callback: (data: any) => void) {
    this.wsCallbacks.set(type, callback);
  }

  public sendWebSocketMessage(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  // HTTP API Methods

  async getAvailableModels(): Promise<LLMModel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }

  async listFiles(path: string = '.'): Promise<FileInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async getFileContent(path: string): Promise<FileContent | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/content?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }

  async saveFileContent(path: string, content: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'write',
          path,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          path,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getAgentStatus(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting agent status:', error);
      return [];
    }
  }

  async runAgent(agentType: string, task: string, context?: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentType}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error running agent:', error);
      throw error;
    }
  }

  async stopAgent(agentType: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentType}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  }

  async stopAllAgents(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/stop-all`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping all agents:', error);
      throw error;
    }
  }

  async testLLM(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dev/test-llm`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error testing LLM:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }

  // Enhanced LSP Methods
  async getLSPServers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lsp/servers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting LSP servers:', error);
      return [];
    }
  }

  async getCodeCompletion(filePath: string, position: {line: number, character: number}, language: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lsp/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          position,
          language
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting code completion:', error);
      return { completions: [] };
    }
  }

  async getHoverInfo(filePath: string, position: {line: number, character: number}, language: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lsp/hover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          position,
          language
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting hover info:', error);
      return { hover_info: null };
    }
  }

  // MCP Methods
  async getMCPServers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/servers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting MCP servers:', error);
      return [];
    }
  }

  async getMCPTools(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/tools`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting MCP tools:', error);
      return [];
    }
  }

  async invokeMCPTool(serverId: string, toolName: string, parameters: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server_id: serverId,
          tool_name: toolName,
          parameters
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error invoking MCP tool:', error);
      throw error;
    }
  }

  // n8n Methods
  async getN8NWorkflows(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/n8n/workflows`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting n8n workflows:', error);
      return [];
    }
  }

  async executeN8NWorkflow(workflowId: string, data: Record<string, any> = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          data
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error executing n8n workflow:', error);
      throw error;
    }
  }

  // Debug Methods
  async getDebugSessions(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/sessions`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting debug sessions:', error);
      return [];
    }
  }

  async startDebugSession(filePath: string, language: string, config?: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          language,
          config
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting debug session:', error);
      throw error;
    }
  }

  async setBreakpoint(sessionId: string, filePath: string, line: number, condition?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/breakpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          file_path: filePath,
          line,
          condition
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting breakpoint:', error);
      throw error;
    }
  }

  // Tool Discovery Methods
  async getAvailableTools(category?: string): Promise<any[]> {
    try {
      const url = category 
        ? `${API_BASE_URL}/api/tools?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/api/tools`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  }

  async invokeTool(toolId: string, capability: string, parameters: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_id: toolId,
          capability,
          parameters
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error invoking tool:', error);
      throw error;
    }
  }

  async getToolAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/analytics`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting tool analytics:', error);
      return {};
    }
  }

  // Git Integration Methods
  async getGitStatus(repositoryPath: string = '.'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/git/status?repository_path=${encodeURIComponent(repositoryPath)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting git status:', error);
      throw error;
    }
  }

  async gitCommit(repositoryPath: string, commitMessage: string, files?: string[], useN8n: boolean = false): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/git/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_path: repositoryPath,
          commit_message: commitMessage,
          files,
          use_n8n: useN8n
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error committing changes:', error);
      throw error;
    }
  }

  async gitPush(repositoryPath: string = '.', remote: string = 'origin', branch: string = 'main'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/git/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_path: repositoryPath,
          remote,
          branch
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error pushing changes:', error);
      throw error;
    }
  }

  async gitPull(repositoryPath: string = '.', remote: string = 'origin', branch: string = 'main'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/git/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_path: repositoryPath,
          remote,
          branch
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error pulling changes:', error);
      throw error;
    }
  }

  // Enhanced Coordination Methods
  async getCoordinationStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coordination/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting coordination status:', error);
      return { agents: [], metrics: {} };
    }
  }

  async submitCoordinationTask(type: string, description: string, priority: string = 'normal', dependencies?: string[], prerequisites?: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coordination/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          description,
          priority,
          dependencies,
          prerequisites
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error submitting coordination task:', error);
      throw error;
    }
  }

  // Container Management Methods
  async getProxmoxNodes(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/nodes`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.nodes || [];
    } catch (error) {
      console.error('Error getting Proxmox nodes:', error);
      return [];
    }
  }

  async getContainers(node: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/lxc`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.containers || [];
    } catch (error) {
      console.error('Error getting containers:', error);
      return [];
    }
  }

  async getVMs(node: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/qemu`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.vms || [];
    } catch (error) {
      console.error('Error getting VMs:', error);
      return [];
    }
  }

  async startContainer(node: string, vmid: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting container:', error);
      throw error;
    }
  }

  async stopContainer(node: string, vmid: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error stopping container:', error);
      throw error;
    }
  }

  async restartContainer(node: string, vmid: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/restart`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error restarting container:', error);
      throw error;
    }
  }

  async getContainerStatus(node: string, vmid: number): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error getting container status:', error);
      return 'unknown';
    }
  }

  async listContainerFiles(node: string, vmid: number, path: string = '/'): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/files?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing container files:', error);
      return [];
    }
  }

  async readContainerFile(node: string, vmid: number, filePath: string): Promise<string> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/files/content?file_path=${encodeURIComponent(filePath)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.error('Error reading container file:', error);
      return '';
    }
  }

  async writeContainerFile(node: string, vmid: number, filePath: string, content: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/files/content?file_path=${encodeURIComponent(filePath)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error writing container file:', error);
      throw error;
    }
  }

  async executeInContainer(node: string, vmid: number, command: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/containers/${node}/lxc/${vmid}/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error executing command in container:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.wsCallbacks.clear();
  }
}

export const apiClient = new ApiClient();
export default apiClient;