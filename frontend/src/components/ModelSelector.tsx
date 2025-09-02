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

const SaveRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ErrorText = styled.span`
  color: ${props => props.theme.colors.text.error};
  font-size: 12px;
`;

const StatusMessage = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.primary};
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
  const { availableModels, settings, setAvailableModels, setSelectedModel } = useAppStore();
  const [provider, setProvider] = useState<'auto'|'openrouter'|'ollama'|'local'>(settings.modelProvider || 'auto');
  const [modelId, setModelId] = useState<string | null>(settings.modelId || null);
  const [openrouterKey, setOpenrouterKey] = useState<string | null>(localStorage.getItem('OPENROUTER_API_KEY'));
  const [ollamaUrl, setOllamaUrl] = useState<string>(localStorage.getItem('OLLAMA_BASE_URL') || 'http://localhost:11434');
  const [models, setModels] = useState<typeof availableModels>(availableModels || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const fetched = await apiClient.getAvailableModels();
      setAvailableModels(fetched);
      setModels(fetched);
    };
    load();
  }, [setAvailableModels]);

  useEffect(() => {
    // persist local inputs to localStorage
    if (openrouterKey) localStorage.setItem('OPENROUTER_API_KEY', openrouterKey);
    else localStorage.removeItem('OPENROUTER_API_KEY');
    if (ollamaUrl) localStorage.setItem('OLLAMA_BASE_URL', ollamaUrl);
    else localStorage.removeItem('OLLAMA_BASE_URL');
  }, [openrouterKey, ollamaUrl]);

  const handleProviderChange = (p: typeof provider) => {
    setProvider(p);
    // if provider changes to local, try to select a local model
    if (p === 'ollama' || p === 'local') {
      const local = models.find(m => m.provider === 'ollama' || m.provider === 'local');
      if (local) setModelId(local.id);
    }
  };

  const filtered = provider === 'auto'
    ? models
    : models.filter(m => {
      if (provider === 'openrouter') return m.provider === 'openrouter';
      if (provider === 'ollama' || provider === 'local') return m.provider === 'ollama' || m.provider === 'local';
      return true;
    });

  const saveProviderSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
  setSaveMessage(null);
    try {
      // store credentials on server where applicable
      if (openrouterKey) {
        await apiClient.storeCredential('openrouter', { api_key: openrouterKey });
      }
      if (ollamaUrl) {
        await apiClient.storeCredential('ollama', { base_url: ollamaUrl });
      }

      // sanity test backend LLM connectivity
      await apiClient.testLLM();

      // persist to global settings
      const { updateSettings } = useAppStore.getState();
      updateSettings({ modelProvider: provider, modelId: modelId });
      // reflect selected model globally
      if (modelId) setSelectedModel(modelId);
  setSaveMessage('Settings saved and verified');
    } catch (err: any) {
      console.error('Error saving provider settings', err);
      setSaveError(err?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SelectorContainer>
      <SelectorLabel>Model</SelectorLabel>

      <ToggleGroup role="tablist" aria-label="Model provider">
        <ToggleButton active={provider === 'auto'} onClick={() => handleProviderChange('auto')} aria-pressed={provider === 'auto'}>Auto</ToggleButton>
        <ToggleButton active={provider === 'openrouter'} onClick={() => handleProviderChange('openrouter')} aria-pressed={provider === 'openrouter'}>Remote</ToggleButton>
        <ToggleButton active={provider === 'ollama'} onClick={() => handleProviderChange('ollama')} aria-pressed={provider === 'ollama'}>Local</ToggleButton>
      </ToggleGroup>

      <Select value={modelId || ''} onChange={(e) => setModelId(e.target.value || null)} aria-label="Model selector">
        <option value="">Auto-select model</option>
        {filtered.map(m => (
          <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
        ))}
      </Select>

      <SettingsGroup>
        <SmallInput placeholder="OpenRouter API Key" value={openrouterKey || ''} onChange={(e) => setOpenrouterKey(e.target.value || null)} />
        <SmallInput placeholder="Ollama URL" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
        <SaveRow>
          <ToggleButton active={false} onClick={saveProviderSettings} aria-disabled={isSaving} aria-busy={isSaving}>{isSaving ? 'Saving...' : 'Save'}</ToggleButton>
          {saveError && <ErrorText role="alert">{saveError}</ErrorText>}
          {saveMessage && <StatusMessage role="status" aria-live="polite">{saveMessage}</StatusMessage>}
        </SaveRow>
      </SettingsGroup>
    </SelectorContainer>
  );
}
