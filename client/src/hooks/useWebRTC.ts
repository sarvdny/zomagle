import { useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket.js';
import { useAppState } from '../state/sessionState.js';
import { WebRTCOfferPayload, WebRTCAnswerPayload, WebRTCICECandidatePayload } from '@shared/events.js';

// Based on "No External STUN/TURN" in PRD, we omit external STUN.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: []
};

export function useWebRTC() {
  const { socket } = useSocket();
  const { roomId, role, status, setStatus, setError } = useAppState();
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // Initialize WebRTC
  useEffect(() => {
    if (status !== 'CONNECTING_MEDIA' && status !== 'IN_CALL') return;
    if (!roomId || !role) return;

    let isMounted = true;

    const initWebRTC = async () => {
      try {
        // Request Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Create Peer Connection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        // Attach local tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle remote track
        pc.ontrack = (event) => {
          // Force a new MediaStream so React state updates
          const newStream = new MediaStream(event.streams[0] ? event.streams[0].getTracks() : [event.track]);
          setRemoteStream(newStream);
        };

        // Handle ICE Candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc:ice-candidate', {
              roomId,
              candidate: event.candidate.toJSON(),
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('ICE Connection State:', pc.iceConnectionState);
        };

        pc.onconnectionstatechange = () => {
          console.log('Connection State:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setStatus('IN_CALL');
          }
        };

        if (role === 'initiator') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', {
            roomId,
            description: pc.localDescription!.toJSON(),
          });
        }

      } catch (err: any) {
        if (isMounted) {
          setError('Could not access camera/microphone: ' + err.message);
          setStatus('ERROR');
        }
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      // Cleanup on unmount or mode change
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setRemoteStream(null);
      setLocalStream(null);
    };
  }, [roomId, role, socket, setStatus, setError]);

  // Handle incoming signaling
  useEffect(() => {
    // We do not return early here because we need to attach socket listeners immediately.
    // They will wait for peerConnectionRef.current to be initialized.

    const onOffer = async (payload: WebRTCOfferPayload) => {
      if (payload.roomId !== roomId) return;
      
      // Wait for PC to be initialized (since getUserMedia might be taking a while)
      const waitForPC = async (): Promise<RTCPeerConnection> => {
        while (!peerConnectionRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return peerConnectionRef.current;
      };

      try {
        const pc = await waitForPC();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', {
          roomId,
          description: pc.localDescription!.toJSON(),
        });
      } catch (e) {
        console.error('Failed to handle offer', e);
      }
    };

    const onAnswer = async (payload: WebRTCAnswerPayload) => {
      if (payload.roomId !== roomId) return;
      
      const waitForPC = async (): Promise<RTCPeerConnection> => {
        while (!peerConnectionRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return peerConnectionRef.current;
      };

      try {
        const pc = await waitForPC();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));
      } catch (e) {
        console.error('Failed to handle answer', e);
      }
    };

    const onIceCandidate = async (payload: WebRTCICECandidatePayload) => {
      if (payload.roomId !== roomId) return;
      
      const waitForPC = async (): Promise<RTCPeerConnection> => {
        while (!peerConnectionRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return peerConnectionRef.current;
      };

      try {
        const pc = await waitForPC();
        if (payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (e) {
        console.error('Failed to handle ice candidate', e);
      }
    };

    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIceCandidate);

    return () => {
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIceCandidate);
    };
  }, [socket, roomId]);

  // Controls
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    cameraEnabled,
    micEnabled,
    toggleCamera,
    toggleMic,
  };
}
