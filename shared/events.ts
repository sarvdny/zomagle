import { z } from 'zod';

export const ChatModeSchema = z.enum(['text', 'video']);
export const RoomIdSchema = z.string().min(1);

// Client -> Server Payloads
export const MatchFindPayloadSchema = z.object({
  mode: ChatModeSchema,
});
export type MatchFindPayload = z.infer<typeof MatchFindPayloadSchema>;

export const MatchCancelPayloadSchema = z.object({
  mode: ChatModeSchema,
});
export type MatchCancelPayload = z.infer<typeof MatchCancelPayloadSchema>;

export const MatchNextPayloadSchema = z.object({
  roomId: RoomIdSchema,
});
export type MatchNextPayload = z.infer<typeof MatchNextPayloadSchema>;

export const ChatSendPayloadSchema = z.object({
  roomId: RoomIdSchema,
  message: z.string().min(1).max(1000),
});
export type ChatSendPayload = z.infer<typeof ChatSendPayloadSchema>;

export const SessionLeavePayloadSchema = z.object({});
export type SessionLeavePayload = z.infer<typeof SessionLeavePayloadSchema>;

// Note: RTCSessionDescriptionInit and RTCIceCandidateInit are DOM types.
// We'll define loose structural schemas for them for runtime validation.
export const RTCSessionDescriptionInitSchema = z.object({
  type: z.enum(['offer', 'pranswer', 'answer', 'rollback']),
  sdp: z.string().optional(),
});

export const RTCIceCandidateInitSchema = z.object({
  candidate: z.string().optional(),
  sdpMid: z.string().nullable().optional(),
  sdpMLineIndex: z.number().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
});

export const WebRTCOfferPayloadSchema = z.object({
  roomId: RoomIdSchema,
  description: RTCSessionDescriptionInitSchema,
});
export type WebRTCOfferPayload = z.infer<typeof WebRTCOfferPayloadSchema>;

export const WebRTCAnswerPayloadSchema = z.object({
  roomId: RoomIdSchema,
  description: RTCSessionDescriptionInitSchema,
});
export type WebRTCAnswerPayload = z.infer<typeof WebRTCAnswerPayloadSchema>;

export const WebRTCICECandidatePayloadSchema = z.object({
  roomId: RoomIdSchema,
  candidate: RTCIceCandidateInitSchema,
});
export type WebRTCICECandidatePayload = z.infer<typeof WebRTCICECandidatePayloadSchema>;

// Server -> Client Payloads
export interface SessionReadyPayload {
  sessionId: string;
}

export interface MatchSearchingPayload {
  mode: 'text' | 'video';
}

export interface MatchFoundPayload {
  roomId: string;
  mode: 'text' | 'video';
  role: 'initiator' | 'receiver';
}

export interface ChatMessagePayload {
  roomId: string;
  messageId: string;
  sender: 'self' | 'stranger';
  message: string;
  timestamp: number;
}

export interface PartnerLeftPayload {
  roomId: string;
}

export interface ServerErrorPayload {
  code: string;
  message: string;
}

export const ERROR_CODES = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  INVALID_MODE: 'INVALID_MODE',
  ALREADY_SEARCHING: 'ALREADY_SEARCHING',
  ALREADY_MATCHED: 'ALREADY_MATCHED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  NOT_ROOM_MEMBER: 'NOT_ROOM_MEMBER',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  SIGNALING_REJECTED: 'SIGNALING_REJECTED',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Interface for Client -> Server events
export interface ClientToServerEvents {
  'match:find': (payload: MatchFindPayload) => void;
  'match:cancel': (payload: MatchCancelPayload) => void;
  'match:next': (payload: MatchNextPayload) => void;
  'chat:send': (payload: ChatSendPayload) => void;
  'session:leave': (payload: SessionLeavePayload) => void;
  'webrtc:offer': (payload: WebRTCOfferPayload) => void;
  'webrtc:answer': (payload: WebRTCAnswerPayload) => void;
  'webrtc:ice-candidate': (payload: WebRTCICECandidatePayload) => void;
}

// Interface for Server -> Client events
export interface ServerToClientEvents {
  'session:ready': (payload: SessionReadyPayload) => void;
  'match:searching': (payload: MatchSearchingPayload) => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
  'partner:left': (payload: PartnerLeftPayload) => void;
  'webrtc:offer': (payload: WebRTCOfferPayload) => void;
  'webrtc:answer': (payload: WebRTCAnswerPayload) => void;
  'webrtc:ice-candidate': (payload: WebRTCICECandidatePayload) => void;
  'server:error': (payload: ServerErrorPayload) => void;
}
