import { AppStateProvider, useAppState } from './state/sessionState.js';
import { useAppController } from './hooks/useAppController.js';
import { Layout } from './components/Layout.js';
import { Lobby } from './components/Lobby/Lobby.js';
import { Chat } from './components/Chat/Chat.js';
import { Video } from './components/Video/Video.js';
import { useSocket } from './hooks/useSocket.js';
import { VideoLoader } from './components/VideoLoader.js';

const AppContent = () => {
  useAppController();
  const { status, error, setError, mode, reset } = useAppState();
  const { socket } = useSocket();

  const handleLeave = () => {
    socket.emit('session:leave', {});
    reset();
  };


  return (
    <Layout>
      {error && (
        <div className="w-full max-w-4xl mx-auto px-margin-desktop">
          <div className="flex items-center justify-between gap-space-sm bg-error-container/20 text-error px-space-md py-space-sm rounded-lg font-body-md">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-error hover:text-on-surface transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {status === 'CONNECTING' && <div className="text-center mt-space-xl font-label-md text-text-secondary">Connecting to server...</div>}
      
      {status === 'DISCONNECTED' && <div className="text-center mt-space-xl font-label-md text-danger">Disconnected from server. Retrying...</div>}
      
      {status === 'IDLE' && <Lobby />}
      
      {status === 'SEARCHING' && (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-12 px-6">
          <p className="font-mono text-xs tracking-[0.5em] uppercase text-[var(--color-muted-foreground)]">
            MODE / {mode}
          </p>
          <h1 className="brutal-display animate-hard-blink text-center text-[16vw] md:text-[11vw]">
            SEARCHING...
          </h1>
          <button type="button" onClick={() => {
            socket.emit('match:cancel', { mode });
            reset();
          }} className="brutal-btn brutal-btn-danger text-lg">
            CANCEL
          </button>
        </div>
      )}

      {status === 'PARTNER_LEFT' && (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-12 px-6 bg-[var(--color-foreground)] text-[var(--color-background)]">
          <p className="font-mono text-xs tracking-[0.5em] uppercase font-bold text-center">
            CONNECTION LOST
          </p>
          <h1 className="brutal-display text-center text-[14vw] md:text-[9vw] text-[var(--color-destructive)]">
            STRANGER LEFT
          </h1>
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <button
              type="button"
              onClick={() => {
                reset();
                setStatus('SEARCHING');
                socket.emit('match:find', { mode });
              }}
              className="brutal-btn brutal-btn-accent text-lg"
            >
              FIND NEXT
            </button>
            <button
              type="button"
              onClick={handleLeave}
              className="brutal-btn border-black text-black bg-white hover:bg-black hover:text-white text-lg"
            >
              LOBBY
            </button>
          </div>
        </div>
      )}

      {(status === 'MATCHED' || status === 'IN_CALL' || status === 'CONNECTING_MEDIA') && (
        <>
          {mode === 'text' && (
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-background)]">
              <div className="flex justify-between items-center px-6 py-4 border-b-[8px] border-[var(--color-foreground)] bg-[var(--color-background)]">
                <h2 className="brutal-display text-2xl">TEXT CHAT</h2>
                <div className="flex gap-4">
                  <button onClick={() => socket.emit('match:next', { roomId: roomId! })} className="brutal-btn py-2 text-sm">
                    SKIP
                  </button>
                  <button onClick={handleLeave} className="brutal-btn brutal-btn-danger py-2 text-sm">
                    LEAVE
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          )}
          
          {mode === 'video' && (
            <div className="h-screen w-screen overflow-hidden grid grid-rows-[1fr_auto] lg:grid-cols-[2fr_minmax(0,1fr)] lg:grid-rows-1 bg-[var(--color-background)]">
              {/* Video Area containing remote, local and controls */}
              <div className="flex flex-col min-h-0 min-w-0 border-b-[8px] lg:border-b-0 lg:border-r-[8px] border-[var(--color-foreground)]">
                <Video />
              </div>
              
              {/* Text Chat Area */}
              <div className="hidden lg:flex min-h-0 min-w-0 flex-col">
                <Chat dense />
              </div>
            </div>
          )}
        </>
      )}

    </Layout>
  );
};

const App = () => {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
};

export default App;
