import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAppStore } from '../store';
import { ChatMessage } from '../store';
import MessageBubble from './MessageBubble';
import ModelSelector from './ModelSelector';
import apiClient from '../services/api';

const ChatContainer = styled.div`
  width: 400px;
  height: 100%;
  background-color: ${props => props.theme.colors.bg.secondary};
  border-left: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
`;

const ChatTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

const InputArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageInput = styled.textarea`
  width: 100%;
  min-height: 60px;
  max-height: 120px;
  padding: 12px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 8px;
  background-color: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.primary};
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.border.accent};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const InputControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ComposerFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
`;

const ModelPill = styled.span`
  background: ${props => props.theme.colors.bg.secondary};
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const SendButton = styled.button<{ disabled: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.disabled ? props.theme.colors.ui.disabled : props.theme.colors.text.accent};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const NewConversationButton = styled.button`
  padding: 6px 12px;
  background: none;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const AgentModeSelector = styled.select`
  padding: 4px 8px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 12px;
  margin-left: 8px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.border.accent};
  }
`;

export default function ChatPanel() {
  const {
    conversations,
    activeConversationId,
    selectedModel,
    toggleChatPanel,
    addMessage,
    createConversation,
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState<'ask' | 'research' | 'code' | 'plan'>('ask');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Load available models on mount and update global store
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await apiClient.getAvailableModels();
        // Update global store instead of local state
        const { setAvailableModels } = useAppStore.getState();
        setAvailableModels(models);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    
    loadModels();
  }, []);

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation('Welcome to Open-Deep-Coder');
    }
  }, [conversations.length, createConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversationId || isLoading) return;

    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content: inputValue.trim()
    };

    // Add user message
    addMessage(activeConversationId, userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend API for LLM response
      const response = await apiClient.chatCompletion({
        messages: [...(activeConversation?.messages || []), {
          id: Date.now().toString(),
          timestamp: new Date(),
          role: userMessage.role,
          content: userMessage.content
        }],
        model: selectedModel || undefined,
        context: {
          conversation_id: activeConversationId,
          agent_mode: agentMode
        }
      });
      
      const assistantMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: response.message.content,
        model: response.model,
        tokens: response.tokens
      };
      
      addMessage(activeConversationId, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      };
      
      addMessage(activeConversationId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    createConversation();
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>AI Assistant</ChatTitle>
  <HeaderControls>
          <AgentModeSelector
            aria-label="Agent mode selector"
            value={agentMode}
            onChange={(e) => setAgentMode(e.target.value as any)}
          >
            <option value="ask">Default Agent</option>
            <option value="research">Research Agent</option>
            <option value="code">Code Agent</option>
            <option value="plan">Plan Agent</option>
          </AgentModeSelector>
          <CloseButton onClick={toggleChatPanel}>✕</CloseButton>
        </HeaderControls>
      </ChatHeader>

      <MessagesContainer>
        {activeConversation?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <MessageBubble 
            message={{
              id: 'loading',
              role: 'assistant',
              content: 'Thinking...',
              timestamp: new Date()
            }}
            isLoading={true}
          />
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

  <InputContainer>
        <InputArea>
          <ModelSelector />
          <MessageInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your code..."
                    aria-label="Chat message input"
            disabled={isLoading}
          />
          <InputControls>
            <NewConversationButton onClick={handleNewConversation}>
              New Chat
            </NewConversationButton>
            <SendButton 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </SendButton>
          </InputControls>
          <ComposerFooter>
            <ModelPill role="status" aria-live="polite">{selectedModel ? selectedModel : 'Auto'}</ModelPill>
            <div>Enter = send • Shift+Enter = newline</div>
          </ComposerFooter>
        </InputArea>
      </InputContainer>
      
    </ChatContainer>
  );
}