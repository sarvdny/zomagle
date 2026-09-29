import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket.js';
import { useAppState } from '../../state/sessionState.js';

function stamp(at: number) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds(),
  ).padStart(2, "0")}`;
}

export const Chat: React.FC<{ dense?: boolean }> = ({ dense = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{id: string, text: string, sender: 'self' | 'stranger', timestamp: number}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { status, roomId } = useAppState();
  const { socket } = useSocket();
  const isPartnerLeft = status === 'PARTNER_LEFT';

  useEffect(() => {
    const onMessage = (payload: any) => {
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
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isPartnerLeft) return;
    
    // Optimistic UI update
    const tempId = Math.random().toString(36).substring(7);
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: inputValue.trim(),
        sender: 'self',
        timestamp: Date.now(),
      },
    ]);

    socket.emit('chat:send', {
      roomId: roomId!,
      message: inputValue.trim(),
    });
    
    setInputValue('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-background)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 border-b-[2px] border-[var(--color-border)] px-4 py-3 ${
              dense ? "text-xs" : "text-base md:text-lg"
            }`}
          >
            <span
              className="shrink-0 font-mono tabular-nums text-[var(--color-muted-foreground)]"
            >
              [{stamp(m.timestamp)}]
            </span>
            <span
              className={`shrink-0 font-mono font-bold uppercase ${
                m.sender === "self" ? "text-[var(--color-accent)]" : ""
              }`}
            >
              {m.sender === "self" ? "YOU>" : "STRANGER>"}
            </span>
            <span className="font-mono break-words">{m.text}</span>
          </div>
        ))}
        {isPartnerLeft && (
          <div className={`flex gap-3 border-b-[2px] border-[var(--color-border)] px-4 py-3 ${dense ? "text-xs" : "text-base md:text-lg"} bg-[var(--color-foreground)] text-[var(--color-background)] font-bold`}>
            <span className="shrink-0 font-mono font-bold uppercase text-[var(--color-destructive)]">SYS&gt;</span>
            <span className="font-mono break-words">STRANGER DISCONNECTED</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex border-t-[8px] border-[var(--color-foreground)] bg-[var(--color-background)]">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isPartnerLeft}
          placeholder={isPartnerLeft ? "PARTNER DISCONNECTED..." : "TYPE..."}
          aria-label="Message"
          className={`min-w-0 flex-1 bg-[var(--color-background)] font-mono uppercase text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none ${
            dense ? "px-3 py-3 text-sm" : "px-6 py-6 text-xl md:text-2xl"
          }`}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isPartnerLeft}
          className={`brutal-btn brutal-btn-accent border-y-0 border-r-0 border-l-[8px] ${
            dense ? "px-4 text-xs" : "px-8 text-lg"
          }`}
        >
          SEND
        </button>
      </form>
    </div>
  );
};
