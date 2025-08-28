/**
 * API Client for Open-Deep-Coder Frontend
 * 
 * Handles communication with the backend API and WebSocket connections.
 */

import { ChatMessage, LLMModel } from '@store';

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