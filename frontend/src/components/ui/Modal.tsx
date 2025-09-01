import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Content = styled.div`
  background: ${p => p.theme.colors.bg.primary};
  color: ${p => p.theme.colors.text.primary};
  padding: 20px;
  border-radius: 8px;
  width: 480px;
  max-width: 92%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
`;

const Header = styled.div`
  display:flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
`;

const Close = styled.button`
  background: transparent;
  border: none;
  color: ${p => p.theme.colors.text.muted};
  cursor: pointer;
  font-size: 18px;
`;

const Body = styled.div`
  font-size: 14px;
  line-height: 1.4;
`;

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <Overlay role="dialog" aria-modal="true">
      <Content>
        <Header>
          <Title>{title}</Title>
          <Close aria-label="Close modal" onClick={onClose}>✕</Close>
        </Header>
        <Body>
          {children}
        </Body>
      </Content>
    </Overlay>
  );
}
