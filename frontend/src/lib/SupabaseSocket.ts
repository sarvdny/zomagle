import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export class SupabaseSocket {
  private client: SupabaseClient | null = null;
  private mmChannel: RealtimeChannel | null = null;
  private roomChannel: RealtimeChannel | null = null;
  private myUuid = generateId();
  private listeners: Record<string, Function[]> = {};
  public connected = false;

  constructor() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.warn('Supabase URL or Key is missing. Supabase backend will not work.');
      return;
    }

    this.client = createClient(url, key);
    
    // Simulate connection
    setTimeout(() => {
      this.connected = true;
      this.trigger('connect');
    }, 100);
  }

  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  
  off(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(f => f !== fn);
  }

  private trigger(event: string, data?: any) {
    if (this.listeners[event]) {
      [...this.listeners[event]].forEach(fn => fn(data));
    }
  }

  connect() {
    if (!this.connected && this.client) {
      this.connected = true;
      this.trigger('connect');
    }
  }

  disconnect() {
    this.connected = false;
    this.trigger('disconnect');
    this.leaveRoom();
    this.stopMatchmaking();
  }

  emit(event: string, data?: any) {
    if (event === 'match:find') {
      this.startMatchmaking(data.mode);
    } else if (event === 'match:cancel') {
      this.stopMatchmaking();
    } else if (event === 'match:next') {
      this.leaveRoom();
      this.startMatchmaking(data.mode || (this as any)._lastMode || 'text');
    } else if (event === 'session:leave') {
      this.leaveRoom();
      this.stopMatchmaking();
    } else if (event.startsWith('webrtc:') || event === 'chat:send') {
      if (this.roomChannel) {
        if (event === 'chat:send') {
           this.roomChannel.send({
             type: 'broadcast',
             event: 'chat:message',
             payload: {
                messageId: generateId(),
                sender: 'stranger',
                message: data.message,
                timestamp: Date.now()
             }
           });
        } else {
           this.roomChannel.send({
             type: 'broadcast',
             event: event,
             payload: data
           });
        }
      }
    }
  }

  private _lastMode = 'text';

  private async startMatchmaking(mode: string) {
    if (!this.client) return;
    this._lastMode = mode;
    this.stopMatchmaking();
    
    this.mmChannel = this.client.channel(`matchmaking:${mode}`);
    
    this.mmChannel.on('presence', { event: 'sync' }, () => {
      const state = this.mmChannel!.presenceState();
      const users: any[] = [];
      for (const id in state) {
        users.push(...state[id]);
      }
      users.sort((a, b) => a.joinedAt - b.joinedAt);
      
      const me = users.find(u => u.uuid === this.myUuid);
      if (!me) return;
      
      const others = users.filter(u => u.uuid !== this.myUuid);
      if (others.length > 0) {
        if (users[0].uuid === this.myUuid) {
           const partner = others[0];
           const roomId = generateId();
           this.mmChannel!.send({
             type: 'broadcast',
             event: 'invite',
             payload: { to: partner.uuid, roomId }
           });
           this.joinRoom(roomId, 'initiator');
        }
      }
    });

    this.mmChannel.on('broadcast', { event: 'invite' }, (payload) => {
      if (payload.payload.to === this.myUuid) {
        this.joinRoom(payload.payload.roomId, 'receiver');
      }
    });

    this.mmChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.mmChannel!.track({ uuid: this.myUuid, joinedAt: Date.now() });
      }
    });
  }
  
  private stopMatchmaking() {
    if (this.mmChannel) {
      this.mmChannel.unsubscribe();
      this.mmChannel = null;
    }
  }

  private joinRoom(roomId: string, role: string) {
    this.stopMatchmaking();
    if (!this.client) return;
    
    this.roomChannel = this.client.channel(`room:${roomId}`);
    
    this.roomChannel.on('broadcast', { event: 'chat:message' }, (payload) => {
       this.trigger('chat:message', payload.payload);
    });
    this.roomChannel.on('broadcast', { event: 'webrtc:offer' }, (payload) => {
       this.trigger('webrtc:offer', payload.payload);
    });
    this.roomChannel.on('broadcast', { event: 'webrtc:answer' }, (payload) => {
       this.trigger('webrtc:answer', payload.payload);
    });
    this.roomChannel.on('broadcast', { event: 'webrtc:ice-candidate' }, (payload) => {
       this.trigger('webrtc:ice-candidate', payload.payload);
    });

    this.roomChannel.on('presence', { event: 'leave' }, (payload) => {
      // If someone leaves, trigger partner:left
      const leftUsers = payload.leftPresences;
      if (leftUsers.some((u: any) => u.uuid !== this.myUuid)) {
        this.trigger('partner:left');
      }
    });

    this.roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
         await this.roomChannel!.track({ uuid: this.myUuid });
         this.trigger('match:found', { roomId, role });
      }
    });
  }

  private leaveRoom() {
    if (this.roomChannel) {
      this.roomChannel.unsubscribe();
      this.roomChannel = null;
    }
  }
}
