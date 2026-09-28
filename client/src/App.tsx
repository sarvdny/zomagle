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
        <div className="flex flex-col items-center justify-center mt-space-xl gap-space-md text-center">
          <VideoLoader className="w-32 h-32 object-contain text-accent" />
          <h2 className="font-headline-md text-headline-md text-text-primary">Searching for a {mode} stranger...</h2>
          <button onClick={() => {
            socket.emit('match:cancel', { mode });
            reset();
          }} className="px-space-lg py-2 mt-space-sm rounded-full bg-bg-secondary border border-border text-text-primary hover:bg-bg-tertiary transition-colors font-label-md">
            Cancel
          </button>
        </div>
      )}

      {status === 'PARTNER_LEFT' && (
        <div className="flex flex-col items-center justify-center mt-space-xl gap-space-md text-center">
          <span className="material-symbols-outlined text-[48px] text-danger">person_off</span>
          <h2 className="font-headline-md text-headline-md text-text-primary">Your partner disconnected.</h2>
          <button onClick={handleLeave} className="px-space-lg py-2 mt-space-sm rounded-full bg-accent text-[#ffffff] hover:brightness-95 transition-colors font-label-md">
            Return to Lobby
          </button>
        </div>
      )}

      {(status === 'MATCHED' || status === 'IN_CALL' || status === 'CONNECTING_MEDIA') && (
        <div className="flex flex-col h-full w-full mx-auto bg-bg-primary relative">
          {mode === 'text' && (
            <div className="flex flex-col h-full w-full max-w-4xl px-margin-desktop py-space-md mx-auto">
              <div className="flex justify-between items-center mb-space-md">
                <h2 className="font-headline-md text-headline-md text-text-primary">Text Chat</h2>
                <button onClick={handleLeave} className="px-space-md py-2 rounded bg-danger text-[#ffffff] font-label-md hover:brightness-95 transition-colors">
                  Leave
                </button>
              </div>
              <div className="flex-1 overflow-hidden min-h-[500px]">
                <Chat />
              </div>
            </div>
          )}
          
          {mode === 'video' && (
            <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-bg-primary">
              {/* Top/Left Video Area */}
              <div className="flex-1 relative flex flex-col bg-[#000000]">
                <div className="absolute top-4 left-4 z-10">
                   <button onClick={handleLeave} className="px-space-md py-2 rounded bg-danger text-[#ffffff] font-label-md hover:brightness-95 transition-colors shadow-lg">
                    Leave
                  </button>
                </div>
                <Video />
              </div>
              
              {/* Right/Bottom Chat Area */}
              <div className="w-full md:w-[380px] h-[40vh] md:h-full shrink-0 border-t md:border-t-0 md:border-l border-border bg-bg-secondary">
                <Chat />
              </div>
            </div>
          )}
        </div>
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
