import React from 'react';
import styled from 'styled-components';
import { ChatMessage } from '@store';

const MessageContainer = styled.div<{ isUser: boolean; isLoading?: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 12px;
  opacity: ${props => props.isLoading ? 0.7 : 1};
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: ${props => 
    props.isUser 
      ? props.theme.colors.text.accent 
      : props.theme.colors.bg.tertiary
  };
  color: ${props => 
    props.isUser 
      ? 'white' 
      : props.theme.colors.text.primary
  };
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  
  ${props => props.isUser && `
    border-bottom-right-radius: 4px;
  `}
  
  ${props => !props.isUser && `
    border-bottom-left-radius: 4px;
    border: 1px solid ${props.theme.colors.border.primary};
  `}
`;

const MessageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: ${props => props.theme.colors.text.muted};
`;

const ModelBadge = styled.span`
  background-color: ${props => props.theme.colors.ui.hover};
  color: ${props => props.theme.colors.text.secondary};
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
`;

const TokenCount = styled.span`
  font-size: 10px;
  color: ${props => props.theme.colors.text.muted};
`;

const LoadingDots = styled.div`
  display: inline-flex;
  gap: 2px;
  
  &::after {
    content: '';
    animation: dots 1.5s infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: '●'; }
    40% { content: '●●'; }
    60% { content: '●●●'; }
    80%, 100% { content: ''; }
  }
`;

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export default function MessageBubbleComponent({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <MessageContainer isUser={isUser} isLoading={isLoading}>
      <div>
        <MessageBubble isUser={isUser}>
          {isLoading ? (
            <>
              {message.content}
              <LoadingDots />
            </>
          ) : (
            message.content
          )}
        </MessageBubble>
        
        <MessageInfo>
          <span>{timestamp}</span>
          {message.model && <ModelBadge>{message.model}</ModelBadge>}
          {message.tokens && <TokenCount>{message.tokens} tokens</TokenCount>}
        </MessageInfo>
      </div>
    </MessageContainer>
  );
}
