import React from 'react';
import styled, { keyframes } from 'styled-components';
import { ChatMessage } from '@store';

const typing = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
`;

const MessageBubbleWrapper = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: ${props => props.isUser 
    ? props.theme.colors.text.accent 
    : props.theme.colors.bg.tertiary};
  color: ${props => props.isUser 
    ? 'white' 
    : props.theme.colors.text.primary};
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: ${props => props.theme.colors.text.muted};
`;

const ModelTag = styled.span`
  background-color: ${props => props.theme.colors.ui.highlight};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
`;

const Timestamp = styled.span`
  font-size: 10px;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.text.muted};
    animation: ${typing} 1.4s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
`;

const CodeBlock = styled.pre`
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
`;

const InlineCode = styled.code`
  background-color: ${props => props.theme.colors.bg.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
`;

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export default function MessageBubble({ message, isLoading = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).trim();
        return <CodeBlock key={index}>{code}</CodeBlock>;
      } else if (part.startsWith('`') && part.endsWith('`')) {
        // Inline code
        const code = part.slice(1, -1);
        return <InlineCode key={index}>{code}</InlineCode>;
      } else {
        // Regular text
        return part;
      }
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <MessageContainer isUser={isUser}>
      <div>
        <MessageBubbleWrapper isUser={isUser}>
          {isLoading ? (
            <LoadingDots>
              <span />
              <span />
              <span />
            </LoadingDots>
          ) : (
            formatContent(message.content)
          )}
        </MessageBubbleWrapper>
        
        {!isLoading && (
          <MessageMeta>
            <div>
              {message.model && !isUser && (
                <ModelTag>{message.model}</ModelTag>
              )}
            </div>
            <Timestamp>
              {formatTimestamp(message.timestamp)}
            </Timestamp>
          </MessageMeta>
        )}
      </div>
    </MessageContainer>
  );
}