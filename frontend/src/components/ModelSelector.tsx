import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppStore } from '@store';

const SelectorContainer = styled.div`
  position: relative;
`;

const SelectorButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  color: ${props => props.theme.colors.text.primary};
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.accent};
  }
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  margin-top: 4px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  display: ${props => props.isOpen ? 'block' : 'none'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModelOption = styled.div<{ isSelected: boolean }>`
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  background-color: ${props => props.isSelected ? props.theme.colors.ui.selection : 'transparent'};
  color: ${props => props.theme.colors.text.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.ui.hover};
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ModelName = styled.div`
  font-weight: 500;
`;

const ModelDetails = styled.div`
  font-size: 10px;
  color: ${props => props.theme.colors.text.muted};
`;

const ProviderBadge = styled.span<{ provider: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 6px;
  background-color: ${props => {
    switch (props.provider) {
      case 'openrouter': return '#4a90e2';
      case 'ollama': return '#2ecc71';
      default: return props.theme.colors.ui.disabled;
    }
  }};
  color: white;
`;

const LoadingState = styled.div`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
`;

export default function ModelSelector() {
  const { 
    selectedModel, 
    availableModels, 
    setSelectedModel, 
    setAvailableModels,
    isLocalMode 
  } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock fetch models - replace with actual API call
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockModels = [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'openrouter' as const,
            capabilities: ['chat', 'code'],
            context_length: 8192,
            is_available: true,
            description: 'Most capable model for complex reasoning'
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'openrouter' as const,
            capabilities: ['chat', 'code'],
            context_length: 4096,
            is_available: true,
            description: 'Fast and efficient for most tasks'
          },
          {
            id: 'claude-3-sonnet',
            name: 'Claude-3 Sonnet',
            provider: 'openrouter' as const,
            capabilities: ['chat', 'code', 'analysis'],
            context_length: 200000,
            is_available: true,
            description: 'Excellent for code analysis and long contexts'
          },
          {
            id: 'llama2:7b',
            name: 'Llama 2 7B',
            provider: 'ollama' as const,
            capabilities: ['chat'],
            context_length: 4096,
            is_available: true,
            description: 'Local model for privacy'
          },
          {
            id: 'codellama:13b',
            name: 'Code Llama 13B',
            provider: 'ollama' as const,
            capabilities: ['code'],
            context_length: 16384,
            is_available: true,
            description: 'Specialized for code generation'
          }
        ];
        
        setAvailableModels(mockModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [setAvailableModels]);

  const filteredModels = availableModels.filter(model => 
    isLocalMode ? model.provider === 'ollama' : model.provider === 'openrouter'
  );

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  const getDisplayName = () => {
    if (selectedModelInfo) {
      return selectedModelInfo.name;
    }
    return 'Auto Select';
  };

  return (
    <SelectorContainer>
      <SelectorButton onClick={() => setIsOpen(!isOpen)}>
        <span>🧠 {getDisplayName()}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </SelectorButton>
      
      <Dropdown isOpen={isOpen}>
        {isLoading ? (
          <LoadingState>Loading models...</LoadingState>
        ) : (
          <>
            <ModelOption
              isSelected={!selectedModel}
              onClick={() => handleModelSelect('')}
            >
              <ModelInfo>
                <ModelName>🎯 Auto Select</ModelName>
                <ModelDetails>Automatically choose the best model for each task</ModelDetails>
              </ModelInfo>
            </ModelOption>
            
            {filteredModels.map((model) => (
              <ModelOption
                key={model.id}
                isSelected={model.id === selectedModel}
                onClick={() => handleModelSelect(model.id)}
              >
                <ModelInfo>
                  <ModelName>
                    <ProviderBadge provider={model.provider}>
                      {model.provider}
                    </ProviderBadge>
                    {model.name}
                  </ModelName>
                  <ModelDetails>
                    {model.description} • {model.context_length.toLocaleString()} tokens
                  </ModelDetails>
                </ModelInfo>
              </ModelOption>
            ))}
            
            {filteredModels.length === 0 && (
              <LoadingState>
                No {isLocalMode ? 'local' : 'remote'} models available
              </LoadingState>
            )}
          </>
        )}
      </Dropdown>
    </SelectorContainer>
  );
}