import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../store';
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

const SelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const SelectorLabel = styled.label`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

const Select = styled.select`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 12px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.border.accent};
  }
  
  option {
    background-color: ${props => props.theme.colors.bg.primary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ProviderBadge = styled.span<{ provider: string }>`
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.provider) {
      case 'openrouter': return '#4CAF50';
      case 'ollama': return '#2196F3';
      default: return props.theme.colors.ui.hover;
    }
  }};
  color: white;
`;

const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${props => props.theme.colors.text.muted};
`;

const SettingsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 8px;
`;

const SmallInput = styled.input`
  padding: 6px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  width: 220px;
  background: ${props => props.theme.colors.bg.primary};
  color: ${props => props.theme.colors.text.primary};
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  background-color: ${props => 
    props.active 
      ? props.theme.colors.text.accent 
      : props.theme.colors.bg.primary
  };
  color: ${props => 
    props.active 
      ? 'white' 
      : props.theme.colors.text.primary
  };
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => 
      props.active 
        ? props.theme.colors.text.accent 
        : props.theme.colors.ui.hover
    };
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export default function ModelSelector() {
  const {
    availableModels,
    selectedModel,
    isLocalMode,
    setSelectedModel,
    toggleLocalMode
  } = useAppStore();

  // Local UI for API keys (persisted to localStorage)
  const [openrouterKey, setOpenrouterKey] = useState<string | null>(localStorage.getItem('OPENROUTER_API_KEY'));
  const [ollamaUrl, setOllamaUrl] = useState<string>(localStorage.getItem('OLLAMA_BASE_URL') || 'http://localhost:11434');

  useEffect(() => {
    if (openrouterKey) localStorage.setItem('OPENROUTER_API_KEY', openrouterKey);
    else localStorage.removeItem('OPENROUTER_API_KEY');
  }, [openrouterKey]);

  useEffect(() => {
    if (ollamaUrl) localStorage.setItem('OLLAMA_BASE_URL', ollamaUrl);
    else localStorage.removeItem('OLLAMA_BASE_URL');
  }, [ollamaUrl]);

  const saveOpenrouterKey = async () => {
    try {
      await apiClient.storeCredential('openrouter', { api_key: openrouterKey });
      alert('OpenRouter key saved to server');
    } catch (err) {
      console.error('Error saving openrouter key', err);
      alert('Failed to save OpenRouter key');
    }
  };

  const saveOllamaUrl = async () => {
    try {
      await apiClient.storeCredential('ollama', { base_url: ollamaUrl });
      alert('Ollama URL saved to server');
    } catch (err) {
      console.error('Error saving ollama url', err);
      alert('Failed to save Ollama URL');
    }
  };

  const filteredModels = isLocalMode 
    ? availableModels.filter(m => m.provider === 'ollama')
    : availableModels.filter(m => m.provider === 'openrouter');

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const getModelDisplayName = (model: typeof availableModels[0]) => {
    const name = model.name.length > 30 ? model.name.substring(0, 30) + '...' : model.name;
    return `${name} (${model.provider})`;
  };

  return (
    <SelectorContainer>
      <SelectorLabel>Model:</SelectorLabel>
      
      <ToggleGroup>
        <ToggleButton 
          active={!isLocalMode}
          onClick={() => !isLocalMode || toggleLocalMode()}
          title="Use remote models via OpenRouter"
        >
          Remote
        </ToggleButton>
        <ToggleButton 
          active={isLocalMode}
          onClick={() => isLocalMode || toggleLocalMode()}
          title="Use local models via Ollama"
        >
          Local
        </ToggleButton>
      </ToggleGroup>
      
      <Select value={selectedModel || ''} onChange={handleModelChange}>
        <option value="">Auto-select model</option>
        {filteredModels.map((model) => (
          <option key={model.id} value={model.id}>
            {getModelDisplayName(model)}
          </option>
        ))}
      </Select>
      
      {selectedModelInfo && (
        <ModelInfo>
          <ProviderBadge provider={selectedModelInfo.provider}>
            {selectedModelInfo.provider}
          </ProviderBadge>
          <span>{selectedModelInfo.contextLength.toLocaleString()} ctx</span>
        </ModelInfo>
      )}

      {/* Small settings inline for API keys */}
      <SettingsGroup>
        <SmallInput
          type="text"
          placeholder="OpenRouter API Key"
          value={openrouterKey || ''}
          onChange={(e) => setOpenrouterKey(e.target.value || null)}
        />
  <ToggleButton active={false} onClick={saveOpenrouterKey}>Save</ToggleButton>
        <SmallInput
          type="text"
          placeholder="Ollama URL (http://host:port)"
          value={ollamaUrl}
          onChange={(e) => setOllamaUrl(e.target.value)}
        />
  <ToggleButton active={false} onClick={saveOllamaUrl}>Save</ToggleButton>
      </SettingsGroup>
    </SelectorContainer>
  );
}
