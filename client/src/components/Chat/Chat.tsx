import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket.js';
import { useAppState } from '../../state/sessionState.js';
import { ChatMessagePayload } from '@shared/events.js';

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'stranger';
  timestamp: number;
}

export const Chat: React.FC = () => {
  const { socket } = useSocket();
  const { roomId, status } = useAppState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (payload: ChatMessagePayload) => {
      setMessages((prev) => [
        ...prev,
        {
          id: payload.messageId,
          text: payload.message,
          sender: payload.sender,
          timestamp: payload.timestamp,
        },
      ]);
    };

    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !roomId) return;

    // Optimistic UI update
    const tempId = Math.random().toString(36).substring(7);
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: inputValue,
        sender: 'self',
        timestamp: Date.now(),
      },
    ]);

    socket.emit('chat:send', {
      roomId,
      message: inputValue,
    });

    setInputValue('');
  };

  const handleNext = () => {
    if (roomId) {
      socket.emit('match:next', { roomId });
    }
  };

  const isPartnerLeft = status === 'PARTNER_LEFT';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-secondary w-full">
      <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-sm bg-bg-primary">
        {messages.length === 0 && (
          <div className="text-center text-text-muted font-body-md my-auto flex flex-col items-center">
            <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">waving_hand</span>
            You're chatting with a stranger.<br />Say hi!
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[85%] p-3 rounded-2xl break-words font-body-md ${
            msg.sender === 'self' 
              ? 'self-end bg-accent text-[#ffffff] rounded-br-sm' 
              : 'self-start bg-bg-tertiary text-text-primary rounded-bl-sm'
          }`}>
            <div className={`font-label-sm text-[10px] mb-1 opacity-70 ${msg.sender === 'self' ? 'text-right' : 'text-left'}`}>
              {msg.sender === 'self' ? 'You' : 'Stranger'}
            </div>
            {msg.text}
          </div>
        ))}

        {isPartnerLeft && (
          <div className="text-center text-danger font-label-md mt-space-md bg-danger/10 p-2 rounded-lg">
            Stranger disconnected.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex p-space-sm bg-bg-secondary border-t border-border gap-space-sm">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isPartnerLeft}
          placeholder={isPartnerLeft ? 'Partner disconnected...' : 'Type a message...'}
          className="flex-1 bg-bg-tertiary border-none text-text-primary placeholder:text-text-muted rounded-full px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isPartnerLeft}
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
        <button 
          type="button" 
          onClick={handleNext}
          className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-primary hover:brightness-95 transition-all shrink-0"
          title="Next Stranger"
        >
          <span className="material-symbols-outlined text-[20px]">skip_next</span>
        </button>
      </form>
    </div>
  );
};
