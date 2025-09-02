import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeVariant } from '../themes';

// LLM Provider Types
export type LLMProvider = 'openrouter' | 'ollama' | 'local';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  capabilities: string[];
  contextLength: number;
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Agent Status Types
export type AgentType = 'orchestrator' | 'planner' | 'implementer' | 'verifier' | 'reviewer' | 'researcher';
export type AgentStatus = 'idle' | 'running' | 'success' | 'error' | 'paused';

export interface Agent {
  type: AgentType;
  status: AgentStatus;
  currentTask?: string;
  progress?: number;
  lastResult?: any;
  error?: string;
}

// Application State Interface
export interface AppState {
  // Theme Management
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  
  // LLM Management
  selectedModel: string | null;
  availableModels: LLMModel[];
  isLocalMode: boolean;
  setSelectedModel: (modelId: string) => void;
  setAvailableModels: (models: LLMModel[]) => void;
  toggleLocalMode: () => void;
  
  // Chat Management
  conversations: Conversation[];
  activeConversationId: string | null;
  isChatPanelOpen: boolean;
  createConversation: (title?: string) => string;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setActiveConversation: (conversationId: string | null) => void;
  toggleChatPanel: () => void;
  clearConversation: (conversationId: string) => void;
  
  // Agent Management
  agents: Record<AgentType, Agent>;
  updateAgentStatus: (agentType: AgentType, status: Partial<Agent>) => void;
  runAgent: (agentType: AgentType, task?: string) => void;
  stopAgent: (agentType: AgentType) => void;
  stopAllAgents: () => void;
  
  // Editor State
  openFiles: string[];
  activeFile: string | null;
  openFile: (filePath: string) => void;
  closeFile: (filePath: string) => void;
  setActiveFile: (filePath: string | null) => void;
  
  // Development Tools
  isTerminalOpen: boolean;
  isSidebarOpen: boolean;
  isAdvancedToolsOpen: boolean;
  sidebarWidth: number;
  toggleTerminal: () => void;
  toggleSidebar: () => void;
  setIsAdvancedToolsOpen: (isOpen: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  // Permissions
  permissions: Record<string, boolean>;
  requestPermission: (resource: string, reason?: string) => Promise<boolean>;
  grantPermission: (resource: string) => void;
  revokePermission: (resource: string) => void;
  
  // Settings
  settings: {
    autoSave: boolean;
    autoSaveDelay: number;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    keybinds: Record<string, string>;
    // Model/provider persistence and UI layout
    modelProvider?: 'auto' | 'openrouter' | 'ollama' | 'local';
    modelId?: string | null;
    rightPanelWidth?: number;
    rightPanelCollapsed?: boolean;
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  // Right panel controls
  setRightPanelWidth: (width: number) => void;
  toggleRightPanelCollapsed: () => void;
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme Management
      theme: 'dark-low',
      setTheme: (theme) => set({ theme }),
      
      // LLM Management
      selectedModel: null,
      availableModels: [],
      isLocalMode: true,
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      setAvailableModels: (models) => set({ availableModels: models }),
      toggleLocalMode: () => set((state) => ({ isLocalMode: !state.isLocalMode })),
      
  // Chat Management
  conversations: [],
  activeConversationId: null,
  isChatPanelOpen: true,
      
      createConversation: (title = 'New Conversation') => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: Conversation = {
          id,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          conversations: [...state.conversations, newConversation],
          activeConversationId: id,
        }));
        
        return id;
      },
      
      addMessage: (conversationId, message) => {
        const fullMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, fullMessage],
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },
      
      setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
      toggleChatPanel: () => set((state) => ({ isChatPanelOpen: !state.isChatPanelOpen })),
      
      clearConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [], updatedAt: new Date() }
              : conv
          ),
        }));
      },
      
      // Agent Management
      agents: {
        orchestrator: { type: 'orchestrator', status: 'idle' },
        planner: { type: 'planner', status: 'idle' },
        implementer: { type: 'implementer', status: 'idle' },
        verifier: { type: 'verifier', status: 'idle' },
        reviewer: { type: 'reviewer', status: 'idle' },
        researcher: { type: 'researcher', status: 'idle' },
      },
      
      updateAgentStatus: (agentType, status) => {
        set((state) => ({
          agents: {
            ...state.agents,
            [agentType]: { ...state.agents[agentType], ...status },
          },
        }));
      },
      
      runAgent: (agentType, task) => {
        // Call backend to run agent if available
        get().updateAgentStatus(agentType, { status: 'running', currentTask: task });
        try {
          // fire and forget; backend will emit status over websocket
          const { apiClient } = require('../services/api');
          apiClient.runAgent(agentType, task).catch((err: any) => {
            console.error('Error running agent on backend:', err);
            get().updateAgentStatus(agentType, { status: 'error', error: String(err) });
          });
        } catch (e) {
          // if backend client not available, keep local status
        }
      },
      
      stopAgent: (agentType) => {
        get().updateAgentStatus(agentType, { status: 'idle', currentTask: undefined });
      },
      
      stopAllAgents: () => {
        const agentTypes: AgentType[] = ['orchestrator', 'planner', 'implementer', 'verifier', 'reviewer', 'researcher'];
        agentTypes.forEach((type) => {
          get().updateAgentStatus(type, { status: 'idle', currentTask: undefined });
        });
      },
      
      // Editor State
      openFiles: [],
      activeFile: null,
      
      openFile: (filePath) => {
        set((state) => ({
          openFiles: state.openFiles.includes(filePath) 
            ? state.openFiles 
            : [...state.openFiles, filePath],
          activeFile: filePath,
        }));
      },
      
      closeFile: (filePath) => {
        set((state) => {
          const newOpenFiles = state.openFiles.filter(f => f !== filePath);
          const newActiveFile = state.activeFile === filePath 
            ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null)
            : state.activeFile;
          
          return {
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
          };
        });
      },
      
      setActiveFile: (filePath) => set({ activeFile: filePath }),
      
      // Development Tools
      isTerminalOpen: false,
      isSidebarOpen: true,
      isAdvancedToolsOpen: false,
      sidebarWidth: 300,
      toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setIsAdvancedToolsOpen: (isOpen) => set({ isAdvancedToolsOpen: isOpen }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      // Permissions
      permissions: {},
      
      requestPermission: async (resource) => {
        // This will show a permission dialog
        // For now, return true as a placeholder
        const granted = true; // await showPermissionDialog(resource, reason);
        if (granted) {
          get().grantPermission(resource);
        }
        return granted;
      },
      
      grantPermission: (resource) => {
        set((state) => ({
          permissions: { ...state.permissions, [resource]: true },
        }));
      },
      
      revokePermission: (resource) => {
        set((state) => ({
          permissions: { ...state.permissions, [resource]: false },
        }));
      },
      
      // Settings
      settings: {
        autoSave: true,
        autoSaveDelay: 1000,
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
        keybinds: {},
  modelProvider: 'auto',
  modelId: null,
  rightPanelWidth: 360,
  rightPanelCollapsed: false,
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
  // Right panel helpers
  setRightPanelWidth: (width) => set({ settings: { ...get().settings, rightPanelWidth: width } }),
  toggleRightPanelCollapsed: () => set((state) => ({ settings: { ...state.settings, rightPanelCollapsed: !state.settings.rightPanelCollapsed } })),
    }),
    {
      name: 'open-deep-coder-store',
      partialize: (state) => ({
        theme: state.theme,
        isLocalMode: state.isLocalMode,
        selectedModel: state.selectedModel,
  conversations: state.conversations,
  isChatPanelOpen: state.isChatPanelOpen,
        settings: state.settings,
        permissions: state.permissions,
        sidebarWidth: state.sidebarWidth,
      }),
    }
  )
);